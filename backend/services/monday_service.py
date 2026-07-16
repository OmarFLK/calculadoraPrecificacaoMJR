from typing import Any, Protocol

import requests

MONDAY_BOARD_QUERY = """
query PricingDemandBoard($boardIds: [ID!]!) {
  boards(ids: $boardIds) {
    id
    name
    state
    board_kind
    columns {
      id
      title
      type
    }
    items_page(limit: 100) {
      cursor
      items {
        id
        name
        group {
          id
          title
        }
        column_values {
          id
          text
          value
        }
      }
    }
  }
}
"""


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


class MondayClientError(RuntimeError):
    """Base error for failures returned by the monday.com client."""


class MondayConfigurationError(MondayClientError):
    """Raised when the monday.com integration has no API token."""


class MondayBoardNotFoundError(MondayClientError):
    """Raised when a board is absent or unavailable to the configured token."""


class MondayClient:
    def __init__(
        self,
        api_key: str,
        *,
        api_url: str = "https://api.monday.com/v2",
        api_version: str = "2026-04",
        timeout_seconds: float = 10,
        session: HttpSession | None = None,
    ) -> None:
        self.api_key = api_key.strip()
        self.api_url = api_url.rstrip("/")
        self.api_version = api_version
        self.timeout_seconds = timeout_seconds
        self.session = session or requests.Session()

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def fetch_board(self, board_id: str | int) -> dict[str, Any]:
        normalized_board_id = str(board_id).strip()
        if not self.is_configured:
            raise MondayConfigurationError("MONDAY_API_KEY is not configured")
        if not normalized_board_id:
            raise ValueError("board_id must be a non-empty monday.com board ID")

        payload = self._execute_query(
            MONDAY_BOARD_QUERY,
            variables={"boardIds": [normalized_board_id]},
        )
        data = payload.get("data") or {}
        boards = data.get("boards") or []
        if not boards:
            raise MondayBoardNotFoundError(
                f"Monday board {normalized_board_id} was not found or is not accessible"
            )

        return boards[0]

    def _execute_query(
        self,
        query: str,
        *,
        variables: dict[str, Any],
    ) -> dict[str, Any]:
        try:
            response = self.session.post(
                self.api_url,
                headers=self._build_headers(),
                json={"query": query, "variables": variables},
                timeout=self.timeout_seconds,
            )
            response.raise_for_status()
            payload = response.json()
        except (requests.RequestException, ValueError) as error:
            raise MondayClientError(
                f"Monday API request failed: {error}"
            ) from error

        errors = payload.get("errors")
        if errors:
            messages = "; ".join(
                str(error.get("message", "Unknown GraphQL error"))
                for error in errors
            )
            raise MondayClientError(f"Monday API returned GraphQL errors: {messages}")

        return payload

    def _build_headers(self) -> dict[str, str]:
        return {
            "Authorization": self.api_key,
            "API-Version": self.api_version,
            "Content-Type": "application/json",
        }
