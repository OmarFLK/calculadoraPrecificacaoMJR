from flask import Blueprint, current_app, jsonify

from models.user import User
from services.monday_service import (
    MondayBoardNotFoundError,
    MondayClient,
    MondayClientError,
    MondayConfigurationError,
)
from utils.auth import login_required

integration_bp = Blueprint("integrations", __name__)


@integration_bp.get("/monday/boards/<board_id>")
@login_required
def get_monday_board(_current_user: User, board_id: str):
    client = MondayClient(
        api_key=current_app.config["MONDAY_API_KEY"],
        api_url=current_app.config["MONDAY_API_URL"],
        api_version=current_app.config["MONDAY_API_VERSION"],
        timeout_seconds=current_app.config["MONDAY_REQUEST_TIMEOUT_SECONDS"],
    )

    try:
        board = client.fetch_board(board_id)
    except MondayConfigurationError as error:
        return jsonify({"error": str(error), "integration": "monday"}), 503
    except MondayBoardNotFoundError as error:
        return jsonify({"error": str(error), "integration": "monday"}), 404
    except MondayClientError as error:
        return jsonify({"error": str(error), "integration": "monday"}), 502

    return jsonify({"board": board, "integration": "monday"})
