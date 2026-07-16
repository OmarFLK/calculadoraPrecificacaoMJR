import json
import logging

from flask import Blueprint, current_app, jsonify, request

from extensions import db
from models.ai_analysis_log import AiAnalysisLog
from models.user import User
from services.ai_service import (
    AiConfigurationError,
    AiServiceError,
    AiValidationError,
    PricingAiService,
)
from utils.auth import login_required

ai_bp = Blueprint("ai", __name__)
logger = logging.getLogger(__name__)


@ai_bp.post("/analyze")
@login_required
def analyze_project(current_user: User):
    payload = request.get_json(silent=True) or {}
    ai_service = create_pricing_ai_service()

    response = ai_service.analyze_project(payload)
    log_ai_analysis(current_user, payload, response)

    return jsonify(response)


@ai_bp.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    ai_service = create_pricing_ai_service()

    try:
        result = ai_service.chat(payload)
    except AiValidationError as error:
        return jsonify({"success": False, "answer": str(error)}), 400
    except AiConfigurationError as error:
        return jsonify({"success": False, "answer": str(error)}), 503
    except AiServiceError as error:
        logger.warning("openai_chat_failed error=%s", error)
        return jsonify({
            "success": False,
            "answer": "Não foi possível consultar a IA no momento. Tente novamente.",
        }), 502

    logger.info(
        "openai_chat_usage model=%s response_id=%s input_tokens=%s output_tokens=%s",
        result.model,
        result.response_id,
        result.input_tokens,
        result.output_tokens,
    )
    return jsonify({"success": True, "answer": result.answer})


def create_pricing_ai_service() -> PricingAiService:
    return PricingAiService(
        api_key=current_app.config["OPENAI_API_KEY"],
        model=current_app.config["OPENAI_MODEL"],
        api_url=current_app.config["OPENAI_RESPONSES_URL"],
        max_output_tokens=current_app.config["OPENAI_MAX_OUTPUT_TOKENS"],
        reasoning_effort=current_app.config["OPENAI_REASONING_EFFORT"],
        timeout_seconds=current_app.config["OPENAI_REQUEST_TIMEOUT_SECONDS"],
    )


def log_ai_analysis(current_user: User, payload: dict, response: dict) -> None:
    ai_log = AiAnalysisLog(
        user_id=current_user.id,
        simulation_id=payload.get("simulation_id"),
        project_id=payload.get("project_id"),
        prompt=payload.get("context") or json.dumps(payload, ensure_ascii=False),
        response=json.dumps(response, ensure_ascii=False),
        suggested_complexity=response.get("complexity_suggestion"),
        estimated_risk=response.get("estimated_risk"),
        model_used=current_app.config["OPENAI_MODEL"],
    )
    db.session.add(ai_log)
    db.session.commit()
