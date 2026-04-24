"""
Rotas de gerenciamento da Evolution API.
Permite criar instância, obter QR Code e verificar status de conexão
diretamente pela interface do OS Digital ou pelo Swagger.
"""
import logging
from fastapi import APIRouter, HTTPException
from services.evolution_service import criar_instancia, obter_qrcode, status_instancia, recriar_instancia

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/evolution", tags=["Evolution API / WhatsApp"])

# Import do dict compartilhado que o webhook popula com o QR
from routers.webhook_whatsapp import latest_qr


def _extrair_base64(dados: dict) -> str | None:
    """
    Normaliza as diferentes estruturas que a Evolution API v2 pode retornar
    para encontrar o base64 do QR Code.
    Formatos conhecidos:
      - { qrcode: { base64: "...", code: "..." } }  (connect endpoint / webhook)
      - { base64: "..." }                            (direto)
      - { code: "..." }                              (Evolution v1 legado)
    """
    if not dados:
        return None
    qr_obj = dados.get("qrcode") or {}
    b64 = (
        qr_obj.get("base64")
        or dados.get("base64")
        or qr_obj.get("code")
        or dados.get("code")
    )
    return b64 or None


@router.post("/setup")
def setup_instancia():
    """
    Cria (ou recria) a instância do WhatsApp na Evolution API.
    Limpa o QR em cache para forçar um novo via webhook.
    """
    # Limpa QR anterior
    latest_qr.clear()
    try:
        resultado = criar_instancia()
        logger.info(f"[Evolution] setup resultado: {resultado}")
        # Tenta retornar QR embutido (só ocorre na primeira criação raramente)
        base64_qr = _extrair_base64(resultado)
        return {"ok": True, "dados": resultado, "qrcode_base64": base64_qr}
    except Exception as e:
        logger.error(f"[Evolution] Erro no setup: {e}")
        raise HTTPException(status_code=500, detail=f"Falha ao criar instância: {str(e)}")


@router.post("/qrcode/reset")
def reset_e_gerar_qr():
    """
    Deleta e recria a instância para forçar a geração de um novo QR Code.
    A Evolution API v2 envia o QR via webhook (QRCODE_UPDATED) após a recriação.
    O frontend deve fazer polling em GET /evolution/qrcode até o QR aparecer.
    """
    latest_qr.clear()
    try:
        resultado = recriar_instancia()
        logger.info(f"[Evolution] recriar_instancia: {resultado}")
        return {"ok": True, "mensagem": "Instância reiniciada. Aguarde o QR Code via webhook.", "dados": resultado}
    except Exception as e:
        logger.error(f"[Evolution] Erro ao recriar instância: {e}")
        raise HTTPException(status_code=500, detail=f"Falha ao recriar instância: {str(e)}")


@router.get("/qrcode")
def get_qrcode():
    """
    Retorna o QR Code (base64) para parear o WhatsApp.
    A Evolution API v2 envia o QR via webhook QRCODE_UPDATED (assíncrono).
    Este endpoint retorna o QR assim que o webhook o entregar.
    """
    # Prioridade 1: QR recebido via webhook (fonte confiável da v2)
    if latest_qr.get("base64"):
        logger.info("[Evolution] QR retornado do cache de webhook")
        return {"ok": True, "base64": latest_qr["base64"], "source": "webhook"}

    # Prioridade 2: Tenta buscar direto (funciona em algumas configs v1/v2)
    try:
        resultado = obter_qrcode()
        logger.info(f"[Evolution] obter_qrcode resultado: {resultado}")
        base64_qr = _extrair_base64(resultado)
        if base64_qr:
            logger.info("[Evolution] QR retornado do endpoint connect")
            return {"ok": True, "base64": base64_qr, "source": "connect"}
    except Exception as e:
        logger.warning(f"[Evolution] Falha ao buscar QR via connect: {e}")

    # QR ainda não disponível—webhook não chegou ainda
    logger.info("[Evolution] QR não disponível ainda")
    return {
        "ok": False,
        "base64": None,
        "mensagem": "QR Code sendo gerado... aguarde alguns segundos."
    }


@router.get("/status")
def get_status():
    """
    Verifica se o WhatsApp está conectado à instância.
    Limpa o QR em cache quando o WhatsApp conectar (state=open).
    """
    try:
        resultado = status_instancia()
        logger.info(f"[Evolution] status: {resultado}")
        # Se conectou, limpa o QR do cache
        state = resultado.get("instance", {}).get("state", "") or resultado.get("state", "")
        if state == "open":
            latest_qr.clear()
        return {"ok": True, "dados": resultado}
    except Exception as e:
        logger.error(f"[Evolution] Erro ao verificar status: {e}")
        raise HTTPException(status_code=500, detail=f"Falha ao verificar status: {str(e)}")
