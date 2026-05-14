import re
from typing import Any

import requests

OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions"
AI_FALLBACK_ANSWER = "Não foi possível consultar a IA no momento."
MISSING_OPENROUTER_KEY_ANSWER = "Chave da IA não configurada."
PRICING_ASSISTANT_SYSTEM_PROMPT = (
    "Você é o Assistente IA de Precificação da Mauá Júnior, uma IA interna da "
    "Mauá Júnior para apoiar a precificação de projetos. Nunca diga que é "
    "DeepSeek, OpenRouter ou outro modelo externo; apresente-se apenas como o "
    "Assistente IA da Mauá Júnior. Ajude com análise de escopo, complexidade, "
    "riscos e precificação. Responda em português do Brasil, de forma curta, "
    "objetiva e profissional. Use texto puro, sem Markdown, sem HTML, sem "
    "negrito com asteriscos e sem títulos com cerquilhas."
)


class PricingAiService:
    def __init__(
        self,
        api_key: str = "",
        model: str = "openrouter/free",
        site_url: str = "",
        app_title: str = "Maua Jr Pricing AI",
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.site_url = site_url
        self.app_title = app_title

    def analyze_project(self, payload: dict[str, Any]) -> dict[str, str]:
        context = str(payload.get("context", "")).strip()
        has_complex_context = len(context) > 600 or "integra" in context.lower()

        return {
            "complexity_suggestion": "Alta" if has_complex_context else "Média",
            "estimated_risk": "Médio",
            "notes": "Projeto com possível risco de escopo. Valide premissas, prazo e custos externos antes de fechar o valor.",
        }

    def chat(self, payload: dict[str, Any]) -> dict[str, Any]:
        message = str(payload.get("message", "")).strip()

        if not message:
            return {"success": False, "answer": "Envie uma mensagem para consultar a IA."}

        print(f"API key carregada: {'YES' if bool(self.api_key) else 'NO'}")
        print(f"Modelo: {self.model}")

        if not self.api_key:
            return {"success": False, "answer": MISSING_OPENROUTER_KEY_ANSWER}

        try:
            answer = self.call_openrouter(payload)
        except requests.RequestException as error:
            response = getattr(error, "response", None)
            if response is not None:
                print(f"Status OpenRouter: {response.status_code}")
                print(f"Resposta erro OpenRouter: {response.text[:500]}")
            else:
                print(f"Erro OpenRouter: {type(error).__name__} - {str(error)[:500]}")
            return {"success": False, "answer": AI_FALLBACK_ANSWER}
        except (KeyError, IndexError, TypeError, ValueError):
            return {"success": False, "answer": AI_FALLBACK_ANSWER}

        return {"success": True, "answer": answer}

    def call_openrouter(self, payload: dict[str, Any]) -> str:
        session = requests.Session()
        session.trust_env = False
        response = session.post(
            OPENROUTER_CHAT_COMPLETIONS_URL,
            headers=self.build_headers(),
            json=self.build_openrouter_payload(payload),
            timeout=30,
        )
        print(f"Status OpenRouter: {response.status_code}")
        response.raise_for_status()
        response_payload = response.json()
        return clean_ai_answer(response_payload["choices"][0]["message"]["content"])

    def build_headers(self) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self.site_url,
            "X-Title": self.app_title,
        }

        return headers

    def build_openrouter_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {
            "model": self.model,
            "messages": [
                {"role": "system", "content": PRICING_ASSISTANT_SYSTEM_PROMPT},
                {"role": "user", "content": build_user_message(payload)},
            ],
        }


def build_user_message(payload: dict[str, Any]) -> str:
    return str(payload.get("message", "")).strip()


def clean_ai_answer(answer: str) -> str:
    text = str(answer).strip()
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"__(.*?)__", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
