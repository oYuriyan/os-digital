import httpx
import sys

url = "http://localhost:8001/chamados/webhook/evolution"
payload = {
  "event": "messages.upsert",
  "data": [
    {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": False
      },
      "message": {
        "conversation": "Olá, minha impressora pifou e não liga mais. Preciso de ajuda urgente."
      }
    }
  ]
}

print("Enviando webhook falso...")
try:
    r = httpx.post(url, json=payload, timeout=30.0)
    print("Status:", r.status_code)
    print("Resposta do Webhook:", r.text)
except Exception as e:
    print("Erro ao acessar backend:", str(e))
