import unittest
from typing import Any

from services.monday_service import (
    MondayClient,
    MondayClientError,
    MondayConfigurationError,
    build_demand_signal,
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


class MondayClientTest(unittest.TestCase):
    def test_fetch_board_sends_authenticated_versioned_query(self) -> None:
        board = {"id": "123", "name": "Pipeline comercial", "items_page": {"items": []}}
        session = RecordingSession({"data": {"boards": [board]}})
        client = MondayClient(
            "test-token",
            api_version="2026-04",
            timeout_seconds=7,
            session=session,
        )

        result = client.fetch_board("123")

        self.assertEqual(board, result)
        self.assertIsNotNone(session.request)
        assert session.request is not None
        self.assertEqual("https://api.monday.com/v2", session.request["url"])
        self.assertEqual("test-token", session.request["headers"]["Authorization"])
        self.assertEqual("2026-04", session.request["headers"]["API-Version"])
        self.assertEqual({"boardIds": ["123"]}, session.request["json"]["variables"])
        self.assertEqual(7, session.request["timeout"])

    def test_fetch_board_requires_api_key(self) -> None:
        client = MondayClient("", session=RecordingSession({}))

        with self.assertRaisesRegex(MondayConfigurationError, "MONDAY_API_KEY"):
            client.fetch_board("123")

    def test_fetch_board_surfaces_graphql_errors(self) -> None:
        session = RecordingSession({"errors": [{"message": "Not Authenticated"}]})
        client = MondayClient("invalid-token", session=session)

        with self.assertRaisesRegex(MondayClientError, "Not Authenticated"):
            client.fetch_board("123")

    def test_build_demand_signal_filters_area_and_active_status(self) -> None:
        board = {
            "id": "123",
            "name": "Pipeline comercial",
            "columns": [
                {"id": "status", "title": "Status", "type": "status"},
                {"id": "area", "title": "Núcleo", "type": "dropdown"},
            ],
            "items_page": {
                "items": [
                    {
                        "id": "1",
                        "name": "Pesquisa A",
                        "column_values": [
                            {"id": "status", "text": "Em negociação"},
                            {"id": "area", "text": "Gestão Empresarial"},
                        ],
                    },
                    {
                        "id": "2",
                        "name": "Sistema B",
                        "column_values": [
                            {"id": "status", "text": "Concluído"},
                            {"id": "area", "text": "Tecnologia"},
                        ],
                    },
                ]
            },
        }

        signal = build_demand_signal(
            board,
            area="Gestão Empresarial",
            active_statuses=("Em negociação", "Em andamento"),
            medium_threshold=1,
            high_threshold=3,
            medium_adjustment=5,
            high_adjustment=10,
        )

        self.assertEqual(1, signal["consideredItems"])
        self.assertEqual(1, signal["activeItems"])
        self.assertEqual("media", signal["level"])
        self.assertEqual(5, signal["adjustmentPercentage"])


if __name__ == "__main__":
    unittest.main()
