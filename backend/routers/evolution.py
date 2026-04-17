"""
Rotas de gerenciamento da Evolution API.
Permite criar instância, obter QR Code e verificar status de conexão
diretamente pela interface do OS Digital ou pelo Swagger.
"""
from fastapi import APIRouter, HTTPException
from services.evolution_service import criar_instancia, obter_qrcode, status_instancia

router = APIRouter(prefix="/evolution", tags=["Evolution API / WhatsApp"])


@router.post("/setup")
def setup_instancia():
    """
    Cria a instância do WhatsApp na Evolution API.
    Basta chamar uma vez. Retorna os dados da instância criada.
    """
    try:
        resultado = criar_instancia()
        return {"ok": True, "dados": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao criar instância: {str(e)}")


from routers.webhook_whatsapp import latest_qr

@router.get("/qrcode")
def get_qrcode():
    """
    Retorna o QR Code para parear o WhatsApp com a instância.
    Em Evolution V2, priorizamos o webhook que populou latest_qr.
    """
    try:
        # Se recebemos webhook assíncrono com o qr atualizado:
        if "base64" in latest_qr and latest_qr["base64"]:
            return {"ok": True, "dados": {"base64": latest_qr["base64"]}}
        
        # Fallback (as vezes V1/algumas setups retornam logo de cara)
        resultado = obter_qrcode()
        return {"ok": True, "dados": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao obter QR Code: {str(e)}")


@router.get("/status")
def get_status():
    """
    Verifica se o WhatsApp está conectado à instância.
    Retorna 'open' se conectado, 'close' se desconectado.
    """
    try:
        resultado = status_instancia()
        return {"ok": True, "dados": resultado}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Falha ao verificar status: {str(e)}")
