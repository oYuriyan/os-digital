"""
Serviço de integração com a Evolution API v2.
Responsável por enviar mensagens de resposta da IA para o WhatsApp do cliente
e gerenciar a instância (criar, conectar, verificar status).
"""
import httpx
from config import settings


def _headers() -> dict:
    return {
        "apikey": settings.EVOLUTION_API_KEY,
        "Content-Type": "application/json",
    }


def _url(path: str) -> str:
    """Monta a URL completa da Evolution API."""
    base = settings.EVOLUTION_API_URL.rstrip("/")
    return f"{base}{path}"


# ── Envio de mensagens ────────────────────────────────────────────────────────

def enviar_mensagem_whatsapp(telefone: str, mensagem: str) -> dict:
    """
    Envia uma mensagem de texto simples via Evolution API.
    
    telefone: número no formato 5511999999999 (sem @s.whatsapp.net)
    mensagem: texto da resposta do bot
    """
    instance = settings.EVOLUTION_INSTANCE_NAME
    payload = {
        "number": telefone,
        "text": mensagem,
    }

    try:
        resp = httpx.post(
            _url(f"/message/sendText/{instance}"),
            json=payload,
            headers=_headers(),
            timeout=15.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        print(f"[Evolution] Erro HTTP ao enviar mensagem: {e.response.status_code} - {e.response.text}")
        raise
    except Exception as e:
        print(f"[Evolution] Erro ao enviar mensagem: {e}")
        raise


# ── Gerenciamento de instância ────────────────────────────────────────────────

def criar_instancia() -> dict:
    """Cria uma nova instância na Evolution API."""
    instance = settings.EVOLUTION_INSTANCE_NAME
    payload = {
        "instanceName": instance,
        "qrcode": True,
        "integration": "WHATSAPP-BAILEYS",
    }

    resp = httpx.post(
        _url("/instance/create"),
        json=payload,
        headers=_headers(),
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()


def obter_qrcode() -> dict:
    """Obtém o QR Code da instância para parear o WhatsApp."""
    instance = settings.EVOLUTION_INSTANCE_NAME
    resp = httpx.get(
        _url(f"/instance/connect/{instance}"),
        headers=_headers(),
        timeout=15.0,
    )
    resp.raise_for_status()
    return resp.json()


def status_instancia() -> dict:
    """Verifica o status de conexão da instância."""
    instance = settings.EVOLUTION_INSTANCE_NAME
    resp = httpx.get(
        _url(f"/instance/connectionState/{instance}"),
        headers=_headers(),
        timeout=10.0,
    )
    resp.raise_for_status()
    return resp.json()
