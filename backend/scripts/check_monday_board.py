import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import Config
from services.monday_service import MondayClient, MondayClientError


def main() -> int:
    board_id = os.getenv("MONDAY_BOARD_ID", "").strip()
    if not board_id:
        print("MONDAY_BOARD_ID is not configured")
        return 1

    client = MondayClient(
        api_key=Config.MONDAY_API_KEY,
        api_url=Config.MONDAY_API_URL,
        api_version=Config.MONDAY_API_VERSION,
        timeout_seconds=Config.MONDAY_REQUEST_TIMEOUT_SECONDS,
    )

    try:
        board = client.fetch_board(board_id)
    except MondayClientError as error:
        print(f"Monday smoke test failed: {error}")
        return 1

    item_count = len(board.get("items_page", {}).get("items", []))
    print(f"Monday board OK: {board['id']} - {board['name']} ({item_count} items loaded)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
