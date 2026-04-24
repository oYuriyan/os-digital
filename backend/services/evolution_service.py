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
        "integration": "WHATSAPP-BAILEYS"
    }

    try:
        resp = httpx.post(
            _url("/instance/create"),
            json=payload,
            headers=_headers(),
            timeout=30.0,
        )
        resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        try:
            error_data = e.response.json()
            if "already in use" in str(error_data):
                # A instância já existe, isto não é um erro fatal
                return {"status": "SUCCESS", "message": "Instância já existente"}
        except:
            pass
        print(f"[Evolution] HTTP Error: {e.response.text}")
        raise


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


def recriar_instancia() -> dict:
    """
    Deleta a instância existente e a recria para forçar a geração de um novo QR Code.
    Na Evolution API v2 com PostgreSQL, o QR Code é entregue de forma assíncrona
    via webhook (evento QRCODE_UPDATED) após a recriação.
    
    IMPORTANTE: O webhook precisa ser configurado explicitamente na instância,
    pois a Evolution v2 com PostgreSQL não herda o webhook global automaticamente.
    """
    import time
    instance = settings.EVOLUTION_INSTANCE_NAME
    webhook_url = f"{settings.EVOLUTION_API_URL.rstrip('/').replace('http://evolution', 'http://backend').replace(':8080', ':8000').replace('localhost:8080', 'backend:8000')}"
    # Usa a URL interna Docker para o webhook
    backend_webhook = "http://backend:8000/chamados/webhook/evolution"

    # 1. Deleta a instância (ignora erro 404 caso não exista)
    try:
        resp_del = httpx.delete(
            _url(f"/instance/delete/{instance}"),
            headers=_headers(),
            timeout=15.0,
        )
        print(f"[Evolution] Delete instância: {resp_del.status_code} - {resp_del.text[:200]}")
    except Exception as e:
        print(f"[Evolution] Aviso ao deletar instância (pode não existir): {e}")

    time.sleep(1)  # Pequena pausa para a Evolution processar a deleção

    # 2. Recria a instância com qrcode=True E webhook configurado
    payload = {
        "instanceName": instance,
        "qrcode": True,
        "integration": "WHATSAPP-BAILEYS",
        "webhook_wa_business": "",
        "webhook": {
            "url": backend_webhook,
            "enabled": True,
            "events": [
                "QRCODE_UPDATED",
                "CONNECTION_UPDATE",
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "messages.upsert",
                "connection.update",
                "qrcode.updated"
            ],
            "webhookByEvents": False,
            "base64": True,
        },
    }
    try:
        resp_create = httpx.post(
            _url("/instance/create"),
            json=payload,
            headers=_headers(),
            timeout=30.0,
        )
        print(f"[Evolution] Criar instância: {resp_create.status_code} - {resp_create.text[:600]}")
        resp_create.raise_for_status()
        data = resp_create.json()

        # 3. Garante que o webhook está configurado (via endpoint separado se necessário)
        time.sleep(1)
        wh_payload = {
            "webhook": {
                "url": backend_webhook,
                "enabled": True,
                "events": ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT", "MESSAGES_UPDATE", "messages.upsert", "connection.update", "qrcode.updated"],
                "webhookByEvents": False,
                "base64": True,
            }
        }
        resp_wh = httpx.post(
            _url(f"/webhook/set/{instance}"),
            json=wh_payload,
            headers=_headers(),
            timeout=15.0,
        )
        print(f"[Evolution] Webhook configurado: {resp_wh.status_code} - {resp_wh.text[:300]}")

        return data
    except httpx.HTTPStatusError as e:
        print(f"[Evolution] Erro ao recriar instância: {e.response.text}")
        raise


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
