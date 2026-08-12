from time import monotonic

from flask import Blueprint, current_app, jsonify, request

from models.user import User
from services.monday_service import (
    MondayBoardNotFoundError,
    MondayClient,
    MondayClientError,
    MondayConfigurationError,
    build_demand_signal,
)
from utils.auth import login_required

integration_bp = Blueprint("integrations", __name__)
_demand_cache: dict[str, tuple[float, dict]] = {}


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


@integration_bp.get("/monday/pricing-context")
def get_monday_pricing_context():
    """Expose only an aggregate demand signal; the board and token stay server-side."""

    board_id = str(current_app.config["MONDAY_BOARD_ID"]).strip()
    if not current_app.config["MONDAY_API_KEY"] or not board_id:
        return jsonify({
            "configured": False,
            "integration": "monday",
            "message": "Configure MONDAY_API_KEY e MONDAY_BOARD_ID no backend.",
        })

    area = request.args.get("area", "").strip()
    refresh_requested = request.args.get("refresh", "").casefold() == "true"
    cache_key = f"{board_id}:{area.casefold()}"
    cached = _demand_cache.get(cache_key)
    cache_ttl = current_app.config["MONDAY_CACHE_TTL_SECONDS"]
    if cached and not refresh_requested and monotonic() - cached[0] < cache_ttl:
        return jsonify({**cached[1], "cached": True})

    client = MondayClient(
        api_key=current_app.config["MONDAY_API_KEY"],
        api_url=current_app.config["MONDAY_API_URL"],
        api_version=current_app.config["MONDAY_API_VERSION"],
        timeout_seconds=current_app.config["MONDAY_REQUEST_TIMEOUT_SECONDS"],
    )
    try:
        board = client.fetch_board(board_id)
        signal = build_demand_signal(
            board,
            area=area,
            status_column_id=current_app.config["MONDAY_STATUS_COLUMN_ID"],
            area_column_id=current_app.config["MONDAY_AREA_COLUMN_ID"],
            active_statuses=current_app.config["MONDAY_ACTIVE_STATUS_LABELS"],
            medium_threshold=current_app.config["MONDAY_DEMAND_MEDIUM_THRESHOLD"],
            high_threshold=current_app.config["MONDAY_DEMAND_HIGH_THRESHOLD"],
            medium_adjustment=current_app.config["MONDAY_DEMAND_MEDIUM_ADJUSTMENT"],
            high_adjustment=current_app.config["MONDAY_DEMAND_HIGH_ADJUSTMENT"],
        )
    except MondayBoardNotFoundError as error:
        return jsonify({"configured": True, "error": str(error), "integration": "monday"}), 404
    except MondayClientError as error:
        return jsonify({"configured": True, "error": str(error), "integration": "monday"}), 502

    payload = {
        "configured": True,
        "integration": "monday",
        "cached": False,
        "signal": signal,
    }
    _demand_cache[cache_key] = (monotonic(), payload)
    return jsonify(payload)
