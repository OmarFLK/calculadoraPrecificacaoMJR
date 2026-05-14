from flask import Blueprint, jsonify

from models.user import User
from services.analytics_service import build_overview
from utils.auth import login_required

analytics_bp = Blueprint("analytics", __name__)


@analytics_bp.get("/overview")
@login_required
def overview(current_user: User):
    return jsonify(build_overview(current_user.id))
