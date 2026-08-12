import unicodedata
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
    items_page(limit: 500) {
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

MONDAY_NEXT_ITEMS_QUERY = """
query PricingDemandNextPage($cursor: String!) {
  next_items_page(limit: 500, cursor: $cursor) {
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
        api_version: str = "2026-07",
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

        board = boards[0]
        items_page = board.get("items_page") or {}
        items = list(items_page.get("items") or [])
        cursor = items_page.get("cursor")

        while cursor:
            next_payload = self._execute_query(
                MONDAY_NEXT_ITEMS_QUERY,
                variables={"cursor": cursor},
            )
            next_page = (next_payload.get("data") or {}).get("next_items_page") or {}
            items.extend(next_page.get("items") or [])
            cursor = next_page.get("cursor")

        board["items_page"] = {"cursor": None, "items": items}
        return board

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


def build_demand_signal(
    board: dict[str, Any],
    *,
    area: str = "",
    status_column_id: str = "",
    area_column_id: str = "",
    active_statuses: tuple[str, ...] = (),
    medium_threshold: int = 4,
    high_threshold: int = 8,
    medium_adjustment: float = 5,
    high_adjustment: float = 10,
) -> dict[str, Any]:
    """Turn board workload into a small, explicit pricing reference signal."""

    columns = board.get("columns") or []
    status_column_id = status_column_id or find_column_id(
        columns,
        ("status", "situacao", "fase", "etapa"),
    )
    area_column_id = area_column_id or find_column_id(
        columns,
        ("area", "nucleo", "servico"),
    )
    normalized_active_statuses = {
        normalize_text(status)
        for status in active_statuses
        if status.strip()
    }
    normalized_area = normalize_text(area)
    items = list((board.get("items_page") or {}).get("items") or [])

    considered_items = []
    for item in items:
        values = column_value_map(item)
        if normalized_area and area_column_id:
            item_area = normalize_text(values.get(area_column_id, ""))
            if normalized_area not in item_area and item_area not in normalized_area:
                continue
        considered_items.append(item)

    active_items = []
    for item in considered_items:
        if not status_column_id or not normalized_active_statuses:
            active_items.append(item)
            continue
        status = normalize_text(column_value_map(item).get(status_column_id, ""))
        if status in normalized_active_statuses:
            active_items.append(item)

    active_count = len(active_items)
    if active_count >= high_threshold:
        level = "alta"
        adjustment = high_adjustment
    elif active_count >= medium_threshold:
        level = "media"
        adjustment = medium_adjustment
    else:
        level = "baixa"
        adjustment = 0.0

    return {
        "boardId": str(board.get("id") or ""),
        "boardName": str(board.get("name") or ""),
        "area": area,
        "level": level,
        "adjustmentPercentage": adjustment,
        "activeItems": active_count,
        "consideredItems": len(considered_items),
        "totalItems": len(items),
        "statusColumnDetected": bool(status_column_id),
        "areaColumnDetected": bool(area_column_id),
    }


def find_column_id(columns: list[dict[str, Any]], candidates: tuple[str, ...]) -> str:
    normalized_candidates = set(candidates)
    for column in columns:
        title = normalize_text(column.get("title", ""))
        if title in normalized_candidates:
            return str(column.get("id") or "")
    return ""


def column_value_map(item: dict[str, Any]) -> dict[str, str]:
    return {
        str(value.get("id") or ""): str(value.get("text") or "")
        for value in item.get("column_values") or []
        if value.get("id")
    }


def normalize_text(value: Any) -> str:
    decomposed = unicodedata.normalize("NFKD", str(value or ""))
    return "".join(character for character in decomposed if not unicodedata.combining(character)).casefold().strip()
