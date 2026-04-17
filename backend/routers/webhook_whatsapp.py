from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
import uuid

import models
import schemas
from database import get_db
from services.groq_service import processar_mensagem_ia
from services.evolution_service import enviar_mensagem_whatsapp

# Armazena globalmente o último QR Code recebido via Webhook para Evolution V2
latest_qr = {}

router = APIRouter(prefix="/chamados", tags=["Tickets / Chamados WhatsApp"])


# ── Utilitário: tenta vincular telefone a um cliente cadastrado ───────────────
def _vincular_cliente_por_telefone(telefone: str, db: Session):
    """Remove caracteres não numéricos e busca nos clientes cadastrados."""
    fone_numeros = "".join(c for c in telefone if c.isdigit())
    todos = db.query(models.Cliente).filter(models.Cliente.telefone.isnot(None)).all()
    for c in todos:
        if c.telefone:
            fone_cad = "".join(ch for ch in c.telefone if ch.isdigit())
            if fone_numeros.endswith(fone_cad) or fone_cad.endswith(fone_numeros):
                return c.id
    return None


# ── WEBHOOK principal — recebe eventos da Evolution API ──────────────────────
@router.post("/webhook/evolution", status_code=200)
async def webhook_evolution(request: Request, db: Session = Depends(get_db)):
    """
    Endpoint chamado pela Evolution API a cada nova mensagem recebida no WhatsApp.
    Gerencia o estado da conversa e delega a resposta ao agente de IA.
    """
    payload = await request.json()

    # A Evolution API encapsula os dados no campo "data"
    data = payload.get("data", payload)
    telefone_raw = data.get("key", {}).get("remoteJid", "") or data.get("from", "")
    # Remove sufixo "@s.whatsapp.net" se existir
    telefone = telefone_raw.replace("@s.whatsapp.net", "").replace("@c.us", "")
    mensagem_cliente = (
        data.get("message", {}).get("conversation")
        or data.get("message", {}).get("extendedTextMessage", {}).get("text")
        or data.get("text", "")
    )

    event_type = payload.get("event", "").upper()
    if event_type in ["QRCODE.UPDATED", "QRCODE_UPDATED", "CONNECTION.UPDATE", "CONNECTION_UPDATE"]:
        qr_obj = data.get("qrcode", {})
        base64_val = qr_obj.get("base64") or data.get("base64")
        if base64_val:
            latest_qr["base64"] = base64_val
        return {"ok": True, "msg": "QR Code registrado via Webhook"}

    if not telefone or not mensagem_cliente:
        return {"ok": True, "msg": "Evento ignorado (sem telefone/mensagem)"}

    # Ignora mensagens próprias (bot enviando para si)
    if data.get("key", {}).get("fromMe"):
        return {"ok": True, "msg": "Mensagem própria ignorada"}

    # ── 1. Busca ou cria chamado ativo para esse telefone ─────────────────────
    chamado = (
        db.query(models.ChamadoWhatsApp)
        .filter(
            models.ChamadoWhatsApp.telefone_origem == telefone,
            models.ChamadoWhatsApp.status == "triagem_ia",
        )
        .order_by(models.ChamadoWhatsApp.data_hora_criacao.desc())
        .first()
    )

    if not chamado:
        cliente_id = _vincular_cliente_por_telefone(telefone, db)
        chamado = models.ChamadoWhatsApp(
            id=uuid.uuid4(),
            telefone_origem=telefone,
            cliente_id=cliente_id,
            status="triagem_ia",
            historico_conversa=[],
        )
        db.add(chamado)
        db.flush()  # Garante o id antes do commit

    # ── 2. Monta o histórico para a IA ───────────────────────────────────────
    historico_atual = list(chamado.historico_conversa or [])
    historico_atual.append({
        "role": "user",
        "content": mensagem_cliente,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # ── 3. Chama o agente IA (Groq) ──────────────────────────────────────────
    try:
        # Para o Groq, enviamos apenas "role" e "content"
        msgs_groq = [{"role": m["role"], "content": m["content"]} for m in historico_atual]
        resultado_ia = processar_mensagem_ia(msgs_groq)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=503, detail=f"Falha na IA: {str(e)}")

    acao = resultado_ia.get("acao", "responder_cliente")
    resposta_texto = resultado_ia.get("resposta_whatsapp", "")

    # Registra a resposta do assistente no histórico
    historico_atual.append({
        "role": "assistant",
        "content": resposta_texto,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    # ── 4. Atualiza o chamado no banco ───────────────────────────────────────
    chamado.historico_conversa = historico_atual
    chamado.resumo_ia = resultado_ia.get("resumo_ia", chamado.resumo_ia)
    chamado.prioridade_ia = resultado_ia.get("prioridade_ia", "media")
    chamado.categoria_ia = resultado_ia.get("categoria_ia", "duvida")

    if acao == "escalar_humano":
        chamado.status = "aguardando_tecnico"

    db.commit()

    # ── 5. Envia a resposta do bot de volta para o WhatsApp do cliente ────────
    if resposta_texto:
        try:
            enviar_mensagem_whatsapp(telefone, resposta_texto)
        except Exception as e:
            # Não quebra o fluxo se o envio falhar — o ticket já está salvo
            print(f"[Webhook] Falha ao enviar resposta via Evolution: {e}")

    return {
        "ok": True,
        "acao": acao,
        "resposta_para_cliente": resposta_texto,
        "chamado_id": str(chamado.id),
    }


# ── CRUD de Chamados para o Kanban do Frontend ────────────────────────────────
@router.get("/", response_model=List[schemas.ChamadoWhatsAppResponse])
def listar_chamados(
    status: str = None,
    db: Session = Depends(get_db),
):
    """Lista todos os chamados. Filtra por status se informado."""
    query = db.query(models.ChamadoWhatsApp)
    if status:
        query = query.filter(models.ChamadoWhatsApp.status == status)
    return query.order_by(models.ChamadoWhatsApp.data_hora_criacao.desc()).all()


@router.get("/{chamado_id}", response_model=schemas.ChamadoWhatsAppResponse)
def buscar_chamado(chamado_id: str, db: Session = Depends(get_db)):
    chamado = db.query(models.ChamadoWhatsApp).filter(
        models.ChamadoWhatsApp.id == chamado_id
    ).first()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    return chamado


@router.patch("/{chamado_id}", response_model=schemas.ChamadoWhatsAppResponse)
def atualizar_chamado(
    chamado_id: str,
    dados: schemas.ChamadoWhatsAppUpdate,
    db: Session = Depends(get_db),
):
    """Permite ao técnico atualizar status/prioridade/categoria manualmente."""
    chamado = db.query(models.ChamadoWhatsApp).filter(
        models.ChamadoWhatsApp.id == chamado_id
    ).first()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    for key, value in dados.model_dump(exclude_unset=True).items():
        setattr(chamado, key, value)
    db.commit()
    db.refresh(chamado)
    return chamado


@router.post("/{chamado_id}/transformar-em-os")
def transformar_em_os(chamado_id: str, db: Session = Depends(get_db)):
    """
    Retorna os dados do chamado pré-formatados para preencher o formulário de Nova OS.
    (O Frontend usa esses dados e redireciona para /os/nova com os campos preenchidos.)
    """
    chamado = db.query(models.ChamadoWhatsApp).filter(
        models.ChamadoWhatsApp.id == chamado_id
    ).first()
    if not chamado:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")

    cliente = chamado.cliente

    return {
        "chamado_id": str(chamado.id),
        "sugestao_os": {
            "cliente_id": str(chamado.cliente_id) if chamado.cliente_id else None,
            "cliente_nome": cliente.razao_social if cliente else "Não identificado",
            "defeito_relatado": chamado.resumo_ia or "Ver transcrição do chamado",
            "tipo_servico": chamado.categoria_ia or "Manutenção",
            "solicitante": "Via WhatsApp",
            "setor": "Externo / WhatsApp",
        }
    }
