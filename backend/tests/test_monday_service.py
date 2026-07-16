import unittest
from typing import Any

from services.monday_service import (
    MondayClient,
    MondayClientError,
    MondayConfigurationError,
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


if __name__ == "__main__":
    unittest.main()
