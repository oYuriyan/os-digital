from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone

import models
import schemas
from database import get_db
from logger import logger

router = APIRouter(prefix="/os", tags=["Ordens de Serviço"])

@router.post("/", response_model=schemas.OrdemServicoResponse)
def criar_os(os: schemas.OrdemServicoCreate, db: Session = Depends(get_db)):
    from sqlalchemy import func as sqlfunc

    # Validação de integridade: O cliente existe?
    cliente = db.query(models.Cliente).filter(models.Cliente.id == os.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado no banco de dados")
    
    # Validação de integridade: O técnico existe?
    tecnico = db.query(models.Usuario).filter(models.Usuario.id == os.tecnico_id).first()
    if not tecnico:
        raise HTTPException(status_code=404, detail="Técnico não encontrado no banco de dados")

    try:
        # Gera o numero_os como próximo número sequencial
        ultimo_numero = db.query(sqlfunc.max(models.OrdemServico.numero_os)).scalar() or 0
        proximo_numero = ultimo_numero + 1

        nova_os = models.OrdemServico(**os.model_dump(), numero_os=proximo_numero)
        db.add(nova_os)
        db.commit()
        db.refresh(nova_os)

        # Evita erro de lazy loading mapeando manualmente o retorno
        return {
            "id": nova_os.id,
            "numero_os": nova_os.numero_os,
            "cliente_id": nova_os.cliente_id,
            "tecnico_id": nova_os.tecnico_id,
            "tipo_servico": nova_os.tipo_servico,
            "solicitante": nova_os.solicitante,
            "setor": nova_os.setor,
            "defeito_relatado": nova_os.defeito_relatado,
            "descricao_servico": nova_os.descricao_servico,
            "equipamento_retirado": nova_os.equipamento_retirado,
            "status": nova_os.status,
            "assinatura_base64": nova_os.assinatura_base64,
            "data_hora_abertura": nova_os.data_hora_abertura,
            "data_hora_termino": nova_os.data_hora_termino,
            "historico": []
        }
    except Exception as e:
        logger.exception("Erro ao criar a Ordem de Serviço")
        raise HTTPException(status_code=500, detail="Erro interno. Verifique os logs.")

@router.get("/")
def listar_os(
    skip: int = 0,
    limit: int = 500,
    status: str = None,
    tecnico_id: str = None,
    cliente_id: str = None,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(models.OrdemServico).options(
            joinedload(models.OrdemServico.historico),
            joinedload(models.OrdemServico.cliente),
            joinedload(models.OrdemServico.tecnico),
        )
        if status:
            query = query.filter(models.OrdemServico.status == status)
        if tecnico_id:
            query = query.filter(models.OrdemServico.tecnico_id == tecnico_id)
        if cliente_id:
            query = query.filter(models.OrdemServico.cliente_id == cliente_id)
        ordens = query.order_by(models.OrdemServico.data_hora_abertura.desc()).offset(skip).limit(limit).all()
        return ordens
    except Exception as e:
        logger.exception("Erro ao listar as Ordens de Serviço")
        raise HTTPException(status_code=500, detail="Erro interno. Verifique os logs.")

@router.get("/{os_id}", response_model=schemas.OrdemServicoResponse)
def buscar_os_por_id(os_id: str, db: Session = Depends(get_db)):
    ordem = db.query(models.OrdemServico).options(
        joinedload(models.OrdemServico.historico),
        joinedload(models.OrdemServico.cliente),
        joinedload(models.OrdemServico.tecnico),
    ).filter(models.OrdemServico.id == os_id).first()
    if not ordem:
        raise HTTPException(status_code=404, detail="Ordem de Serviço não encontrada")
    return ordem

@router.put("/{os_id}", response_model=schemas.OrdemServicoResponse)
def atualizar_os(os_id: str, os_atualizada: schemas.OrdemServicoUpdate, db: Session = Depends(get_db)):
    db_os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not db_os:
        raise HTTPException(status_code=404, detail="Ordem de Serviço não encontrada")
    
    # Grava o histórico antes de aplicar as mudanças
    if os_atualizada.usuario_nome:
        pos_conclusao = db_os.status in ["fechada", "concluída", "concluida"]
        
        mudancas = []
        if os_atualizada.descricao_servico is not None and os_atualizada.descricao_servico != db_os.descricao_servico:
            mudancas.append("Relatório técnico editado")
        if os_atualizada.equipamento_retirado is not None and os_atualizada.equipamento_retirado != db_os.equipamento_retirado:
            mudancas.append("Equipamento retirado modificado")
        if os_atualizada.status is not None and os_atualizada.status != db_os.status:
            mudancas.append(f"Status alterado ({db_os.status} -> {os_atualizada.status})")
            
        texto_auditoria = "Alterações: " + ", ".join(mudancas) if mudancas else "Atualização na OS"
        
        if pos_conclusao:
            texto_auditoria = "[PÓS-CONCLUSÃO] " + texto_auditoria
            # Reforçamos no back-end que a assinatura será mantida (apenas logar e pronto)
        elif os_atualizada.status == "fechada" and not pos_conclusao:
            texto_auditoria = "Encerrou o atendimento e coletou a assinatura do cliente."

        novo_historico = models.HistoricoOS(
            os_id=db_os.id,
            usuario_nome=os_atualizada.usuario_nome,
            descricao=texto_auditoria
        )
        db.add(novo_historico)

    # Atualiza a OS (tirando o usuario_nome, pois ele não pertence à tabela OS)
    dados_atualizacao = os_atualizada.model_dump(exclude_unset=True, exclude={"usuario_nome"})
    for chave, valor in dados_atualizacao.items():
        setattr(db_os, chave, valor)
    
    if db_os.status.lower() in ["fechada", "concluída", "concluida"] and not db_os.data_hora_termino:
        db_os.data_hora_termino = datetime.now(timezone.utc)

    db.commit()
    db.refresh(db_os)
    
    # Prepara explicitamente o relacionamento do histórico lendo os dados antes
    # de Pydantic serializar a resposta (já que a sessão fecha log depois)
    historico_atual = db.query(models.HistoricoOS).filter(models.HistoricoOS.os_id == db_os.id).all()
    setattr(db_os, "historico", historico_atual)
    
    return db_os

@router.delete("/{os_id}", status_code=204)
def deletar_os(os_id: str, db: Session = Depends(get_db)):
    db_os = db.query(models.OrdemServico).filter(models.OrdemServico.id == os_id).first()
    if not db_os:
        raise HTTPException(status_code=404, detail="Ordem de Serviço não encontrada")
    db.delete(db_os)
    db.commit()
    return None
