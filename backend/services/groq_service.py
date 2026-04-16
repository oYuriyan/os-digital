"""
Serviço de IA usando Groq API com o modelo Llama-3.3-70b-versatile.
Retorna SEMPRE um JSON estruturado com a decisão do agente L1.
"""
import json
import os
from typing import List, Dict

from groq import Groq
from config import settings

# Cliente inicializado de forma lazy para garantir que o .env já foi carregado
_client: Groq | None = None

def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = settings.GROQ_API_KEY or os.environ.get("GROQ_API_KEY", "")
        _client = Groq(api_key=api_key)
    return _client

SYSTEM_PROMPT = """Você é o Assistente de Suporte Nível 1 da **Micro Sistema Soluções**, empresa especializada em TI corporativa.

Seu comportamento:
- Cumprimente o cliente pelo nome/empresa quando souber.
- Tente resolver problemas simples de forma didática e amigável (reiniciar equipamento, verificar cabos, limpar cache, reiniciar serviço de impressão, etc.).
- Use linguagem profissional mas descontraída, sem ser robótico.
- Após **2 tentativas de resolução sem sucesso**, ou se o problema for claramente físico (queda, derramamento, hardware danificado, sem hardware disponível, manutenção, troca de equipamento e etc), encaminhe a um técnico humano.

Você DEVE retornar EXCLUSIVAMENTE um objeto JSON válido com as seguintes chaves:
{
  "acao": "responder_cliente" | "escalar_humano",
  "resposta_whatsapp": "<mensagem que será enviada ao cliente>",
  "resumo_ia": "<resumo técnico do problema em 1-2 frases, para o técnico>",
  "prioridade_ia": "baixa" | "media" | "alta",
  "categoria_ia": "hardware" | "software" | "rede" | "duvida"
}

Regras para prioridade_ia:
- "alta": Sistema parado, empresa sem operar, perda financeira imediata.
- "media": Problema impacta trabalho mas há alternativa temporária.
- "baixa": Dúvida, lentidão pontual, problema não urgente.

Nunca inclua texto fora do JSON. Nunca use markdown. Apenas o JSON puro.
"""


def processar_mensagem_ia(historico_conversa: List[Dict]) -> Dict:
    """
    Recebe o histórico completo da conversa e chama o Groq.
    
    historico_conversa: lista de dicts com {"role": "user/assistant", "content": "..."}
    
    Retorna o dict JSON parseado com as chaves definidas no SYSTEM_PROMPT.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + historico_conversa

    response = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.4,  # Baixo para respostas mais consistentes/precisas
        max_tokens=1024,
    )

    raw = response.choices[0].message.content
    resultado = json.loads(raw)
    return resultado
