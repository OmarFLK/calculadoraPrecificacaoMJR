import json
import re
from dataclasses import dataclass
from typing import Any, Protocol

import requests

OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses"
MAX_USER_CONTEXT_CHARS = 7000
PRICING_ASSISTANT_SYSTEM_PROMPT = (
    "Você é o Assistente IA de Precificação da Mauá Júnior. Responda em português "
    "do Brasil, de forma curta, objetiva e profissional. Analise escopo, custos, "
    "complexidade e riscos, mas nunca invente um preço. Quando mencionar valores, "
    "identifique se vieram do cálculo atual ou da mediana histórica fornecida. Se os "
    "multiplicadores específicos do serviço vieram dos manuais internos anexados. "
    "Nunca trate o sinal de demanda do monday.com como preço final: ele é apenas uma "
    "referência percentual explícita, aplicada depois do cálculo principal. Se houver "
    "variável incompleta ou marcada para revisão, avise antes de recomendar fechamento. "
    "Se os dados forem insuficientes, diga exatamente o que falta. Use texto puro, sem "
    "Markdown ou HTML."
)

PRICING_SCALAR_FIELDS = (
    "projectName",
    "area",
    "nucleus",
    "service",
    "complexity",
    "totalWorkedHours",
    "averageHourValue",
    "desiredProfitMargin",
    "taxes",
    "dynamicCostsTotal",
    "suggestedPrice",
    "complexityMultiplier",
    "serviceMultiplier",
    "combinedMultiplier",
    "serviceVariablesComplete",
    "serviceVariablesNeedReview",
)


class HttpResponse(Protocol):
    def raise_for_status(self) -> None: ...

    def json(self) -> dict[str, Any]: ...


class HttpSession(Protocol):
    def post(
        self,
        url: str,
        *,
        headers: dict[str, str],
        json: dict[str, Any],
        timeout: float,
    ) -> HttpResponse: ...


class AiServiceError(RuntimeError):
    """Base error for OpenAI pricing assistant failures."""


class AiConfigurationError(AiServiceError):
    """Raised when OPENAI_API_KEY is missing."""


class AiValidationError(AiServiceError):
    """Raised when the chat request has no usable message."""


@dataclass(frozen=True)
class AiChatResult:
    answer: str
    model: str
    response_id: str
    input_tokens: int
    output_tokens: int


class PricingAiService:
    def __init__(
        self,
        api_key: str = "",
        model: str = "gpt-5.6-luna",
        *,
        api_url: str = OPENAI_RESPONSES_URL,
        max_output_tokens: int = 320,
        reasoning_effort: str = "none",
        timeout_seconds: float = 30,
        session: HttpSession | None = None,
    ) -> None:
        self.api_key = api_key.strip()
        self.model = model
        self.api_url = api_url.rstrip("/")
        self.max_output_tokens = max_output_tokens
        self.reasoning_effort = reasoning_effort.strip()
        self.timeout_seconds = timeout_seconds
        self.session = session or requests.Session()

    def analyze_project(self, payload: dict[str, Any]) -> dict[str, str]:
        context = str(payload.get("context", "")).strip()
        has_complex_context = len(context) > 600 or "integra" in context.casefold()

        return {
            "complexity_suggestion": "Alta" if has_complex_context else "Média",
            "estimated_risk": "Médio",
            "notes": "Valide premissas, prazo e custos externos antes de fechar o valor.",
        }

    def chat(self, payload: dict[str, Any]) -> AiChatResult:
        message = str(payload.get("message", "")).strip()
        if not message:
            raise AiValidationError("Envie uma mensagem para consultar a IA.")
        if not self.api_key:
            raise AiConfigurationError("OPENAI_API_KEY não está configurada.")

        response_payload = self._request_response(payload)
        answer = extract_output_text(response_payload)
        if not answer:
            raise AiServiceError("OpenAI response did not contain output text")

        usage = response_payload.get("usage") or {}
        return AiChatResult(
            answer=clean_ai_answer(answer),
            model=str(response_payload.get("model") or self.model),
            response_id=str(response_payload.get("id") or ""),
            input_tokens=to_nonnegative_int(usage.get("input_tokens")),
            output_tokens=to_nonnegative_int(usage.get("output_tokens")),
        )

    def build_response_payload(self, payload: dict[str, Any]) -> dict[str, Any]:
        response_payload: dict[str, Any] = {
            "model": self.model,
            "instructions": PRICING_ASSISTANT_SYSTEM_PROMPT,
            "input": build_user_message(payload),
            "max_output_tokens": self.max_output_tokens,
            "store": False,
        }
        if self.reasoning_effort:
            response_payload["reasoning"] = {"effort": self.reasoning_effort}
        return response_payload

    def _request_response(self, payload: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self.session.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=self.build_response_payload(payload),
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            response_payload = response.json()
        except (requests.RequestException, ValueError) as error:
            raise AiServiceError(f"OpenAI request failed: {error}") from error

        api_error = response_payload.get("error")
        if api_error:
            message = str(api_error.get("message", "Unknown OpenAI API error"))
            raise AiServiceError(f"OpenAI API returned an error: {message}")
        return response_payload


def build_user_message(payload: dict[str, Any]) -> str:
    message = bounded_text(payload.get("message"), 1200)
    project_context = bounded_text(payload.get("projectContext"), 1600)
    pricing_data = sanitize_pricing_data(payload.get("pricingData"))
    conversation = sanitize_conversation(payload.get("conversation"))

    sections = [f"Pergunta atual:\n{message}"]
    if project_context:
        sections.append(f"Contexto do projeto:\n{project_context}")
    sections.append(
        "Dados atuais da precificação:\n"
        + json.dumps(pricing_data, ensure_ascii=False, separators=(",", ":"))
    )
    if conversation:
        sections.append(
            "Conversa recente:\n"
            + json.dumps(conversation, ensure_ascii=False, separators=(",", ":"))
        )
    return "\n\n".join(sections)[:MAX_USER_CONTEXT_CHARS]


def sanitize_pricing_data(raw_pricing_data: Any) -> dict[str, Any]:
    if not isinstance(raw_pricing_data, dict):
        return {}

    pricing_data = {
        field: sanitize_context_value(raw_pricing_data[field])
        for field in PRICING_SCALAR_FIELDS
        if raw_pricing_data.get(field) not in (None, "")
    }
    pricing_data["costValues"] = sanitize_cost_values(raw_pricing_data.get("costValues"))
    pricing_data["additionalCosts"] = sanitize_additional_costs(
        raw_pricing_data.get("additionalCosts")
    )
    pricing_data["serviceVariableSelections"] = sanitize_service_variables(
        raw_pricing_data.get("serviceVariableSelections")
    )
    monday_signal = raw_pricing_data.get("mondayDemandSignal")
    if isinstance(monday_signal, dict):
        pricing_data["mondayDemandSignal"] = {
            key: sanitize_context_value(monday_signal[key])
            for key in (
                "level",
                "adjustmentPercentage",
                "activeItems",
                "consideredItems",
                "boardName",
                "area",
            )
            if monday_signal.get(key) not in (None, "")
        }
    historical_suggestion = raw_pricing_data.get("historicalSuggestion")
    if isinstance(historical_suggestion, dict):
        pricing_data["historicalSuggestion"] = {
            key: sanitize_context_value(historical_suggestion[key])
            for key in (
                "area",
                "sampleCount",
                "medianPrice",
                "minimumPrice",
                "maximumPrice",
            )
            if historical_suggestion.get(key) not in (None, "")
        }
    return pricing_data


def sanitize_service_variables(raw_variables: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_variables, list):
        return []
    variables: list[dict[str, Any]] = []
    for raw_variable in raw_variables[:12]:
        if not isinstance(raw_variable, dict):
            continue
        variables.append({
            "variable": bounded_text(raw_variable.get("questionLabel"), 100),
            "selection": bounded_text(raw_variable.get("optionLabel"), 120),
            "multiplier": sanitize_context_value(raw_variable.get("multiplier")),
            "note": bounded_text(raw_variable.get("note"), 160),
        })
    return variables


def sanitize_cost_values(raw_cost_values: Any) -> dict[str, Any]:
    if not isinstance(raw_cost_values, dict):
        return {}
    return {
        bounded_text(key, 80): sanitize_context_value(value)
        for key, value in list(raw_cost_values.items())[:20]
        if value not in (None, "")
    }


def sanitize_additional_costs(raw_additional_costs: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_additional_costs, list):
        return []

    costs: list[dict[str, Any]] = []
    for raw_cost in raw_additional_costs[:10]:
        if not isinstance(raw_cost, dict):
            continue
        costs.append(
            {
                "description": bounded_text(raw_cost.get("description"), 120),
                "amount": sanitize_context_value(raw_cost.get("amount", "")),
            }
        )
    return costs


def sanitize_conversation(raw_conversation: Any) -> list[dict[str, str]]:
    if not isinstance(raw_conversation, list):
        return []

    messages: list[dict[str, str]] = []
    for raw_message in raw_conversation[-6:]:
        if not isinstance(raw_message, dict):
            continue
        role = raw_message.get("role")
        if role not in {"assistant", "user"}:
            continue
        content = bounded_text(raw_message.get("content"), 500)
        if content:
            messages.append({"role": role, "content": content})
    return messages


def extract_output_text(response_payload: dict[str, Any]) -> str:
    direct_output = response_payload.get("output_text")
    if direct_output:
        return str(direct_output)

    text_parts: list[str] = []
    for output_item in response_payload.get("output") or []:
        if not isinstance(output_item, dict) or output_item.get("type") != "message":
            continue
        for content_item in output_item.get("content") or []:
            if isinstance(content_item, dict) and content_item.get("type") == "output_text":
                text_parts.append(str(content_item.get("text", "")))
    return "\n".join(part for part in text_parts if part).strip()


def bounded_text(value: Any, maximum_length: int) -> str:
    return str(value or "").strip()[:maximum_length]


def sanitize_context_value(value: Any) -> Any:
    if isinstance(value, (bool, int, float)):
        return value
    return bounded_text(value, 160)


def to_nonnegative_int(value: Any) -> int:
    try:
        return max(0, int(value or 0))
    except (TypeError, ValueError):
        return 0


def clean_ai_answer(answer: str) -> str:
    text = str(answer).strip()
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"__(.*?)__", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"(?m)^\s{0,3}#{1,6}\s*", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
