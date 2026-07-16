import unittest
from typing import Any

from app import create_app
from config import TestConfig
from services.ai_service import (
    AiConfigurationError,
    PricingAiService,
    build_user_message,
)


class FakeResponse:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, Any]:
        return self.payload


class RecordingSession:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.response = FakeResponse(payload)
        self.request: dict[str, Any] | None = None

    def post(self, url: str, **kwargs: Any) -> FakeResponse:
        self.request = {"url": url, **kwargs}
        return self.response


class PricingAiServiceTest(unittest.TestCase):
    def test_chat_uses_responses_api_and_returns_usage(self) -> None:
        session = RecordingSession({
            "id": "resp_123",
            "model": "gpt-5.6-luna",
            "output": [{
                "type": "message",
                "content": [{"type": "output_text", "text": "Preço baseado na mediana histórica."}],
            }],
            "usage": {"input_tokens": 140, "output_tokens": 28},
        })
        service = PricingAiService(
            api_key="test-key",
            max_output_tokens=250,
            timeout_seconds=12,
            session=session,
        )

        result = service.chat({
            "message": "O valor está coerente?",
            "projectContext": "Integração com ERP.",
            "pricingData": {
                "area": "Tecnologia",
                "suggestedPrice": 32000,
                "historicalSuggestion": {"sampleCount": 4, "medianPrice": 30000},
            },
        })

        self.assertEqual("Preço baseado na mediana histórica.", result.answer)
        self.assertEqual(140, result.input_tokens)
        self.assertEqual(28, result.output_tokens)
        self.assertIsNotNone(session.request)
        assert session.request is not None
        self.assertEqual("https://api.openai.com/v1/responses", session.request["url"])
        self.assertEqual("Bearer test-key", session.request["headers"]["Authorization"])
        self.assertEqual(250, session.request["json"]["max_output_tokens"])
        self.assertEqual("none", session.request["json"]["reasoning"]["effort"])
        self.assertFalse(session.request["json"]["store"])
        self.assertEqual(12, session.request["timeout"])
        self.assertIn('"medianPrice":30000', session.request["json"]["input"])

    def test_chat_requires_openai_api_key(self) -> None:
        service = PricingAiService(api_key="", session=RecordingSession({}))

        with self.assertRaisesRegex(AiConfigurationError, "OPENAI_API_KEY"):
            service.chat({"message": "Analise o preço"})

    def test_user_message_limits_history_and_ignores_unknown_fields(self) -> None:
        conversation = [
            {"role": "user", "content": f"mensagem-{index}"}
            for index in range(8)
        ]
        user_message = build_user_message({
            "message": "Analise",
            "conversation": conversation,
            "pricingData": {
                "area": "Design",
                "internalSecret": "não deve sair",
            },
        })

        self.assertNotIn("mensagem-0", user_message)
        self.assertNotIn("mensagem-1", user_message)
        self.assertIn("mensagem-7", user_message)
        self.assertNotIn("internalSecret", user_message)
        self.assertNotIn("não deve sair", user_message)

    def test_chat_accepts_direct_output_text(self) -> None:
        session = RecordingSession({"output_text": "Resposta direta", "usage": {}})
        service = PricingAiService(api_key="test-key", session=session)

        result = service.chat({"message": "Analise"})

        self.assertEqual("Resposta direta", result.answer)

    def test_chat_route_degrades_gracefully_without_key(self) -> None:
        app = create_app(TestConfig)
        app.config["OPENAI_API_KEY"] = ""

        response = app.test_client().post("/ai/chat", json={"message": "Analise"})

        self.assertEqual(503, response.status_code)
        self.assertFalse(response.get_json()["success"])
        self.assertIn("OPENAI_API_KEY", response.get_json()["answer"])


if __name__ == "__main__":
    unittest.main()
