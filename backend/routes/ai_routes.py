import json

from flask import Blueprint, current_app, jsonify, request

from extensions import db
from models.ai_analysis_log import AiAnalysisLog
from models.user import User
from services.ai_service import PricingAiService
from utils.auth import login_required

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/analyze")
@login_required
def analyze_project(current_user: User):
    payload = request.get_json(silent=True) or {}
    ai_service = PricingAiService(
        api_key=current_app.config["OPENAI_API_KEY"],
        model=current_app.config["OPENAI_MODEL"],
    )

    response = ai_service.analyze_project(payload)
    log_ai_analysis(current_user, payload, response)

    return jsonify(response)


@ai_bp.post("/chat")
def chat():
    payload = request.get_json(silent=True) or {}
    ai_service = PricingAiService(
        api_key=current_app.config["OPENROUTER_API_KEY"],
        model=current_app.config["OPENROUTER_MODEL"],
        site_url=current_app.config["OPENROUTER_SITE_URL"],
        app_title=current_app.config["OPENROUTER_APP_TITLE"],
    )

    return jsonify(ai_service.chat(payload))


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
