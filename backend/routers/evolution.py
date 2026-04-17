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


@router.get("/qrcode")
def get_qrcode():
    """
    Retorna o QR Code para parear o WhatsApp com a instância.
    Abra este endpoint no navegador ou no Swagger para ver o QR code.
    """
    try:
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
