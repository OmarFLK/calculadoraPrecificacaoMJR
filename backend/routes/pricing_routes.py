from flask import Blueprint, jsonify, request

from extensions import db
from models.pricing_simulation import PricingSimulation
from models.user import User
from services.catalog_service import resolve_pricing_relations
from services.historical_pricing_service import get_historical_suggestion
from services.pricing_service import build_pricing_simulation, calculate_pricing
from utils.auth import login_required
from utils.validators import VALID_NUCLEI, validate_enum

pricing_bp = Blueprint("pricing", __name__)
simulations_bp = Blueprint("simulations", __name__)


@pricing_bp.post("/calculate")
@login_required
def calculate(current_user: User):
    payload = request.get_json(silent=True) or {}
    relations = resolve_pricing_relations(payload)
    return jsonify(calculate_pricing(payload, relations["complexity_multiplier"]))


@pricing_bp.get("/suggestions")
@login_required
def historical_suggestion(_current_user: User):
    area = request.args.get("area", "").strip()
    validate_enum(area, VALID_NUCLEI, "area", required=True)
    return jsonify(get_historical_suggestion(area))


@simulations_bp.post("")
@login_required
def create_simulation(current_user: User):
    payload = request.get_json(silent=True) or {}
    relations = resolve_pricing_relations(payload)
    simulation = build_pricing_simulation(
        current_user.id,
        payload,
        relations,
        relations["complexity_multiplier"],
    )
    db.session.add(simulation)
    db.session.commit()

    return jsonify({"simulation": simulation.to_dict()}), 201


@simulations_bp.get("")
@login_required
def list_simulations(current_user: User):
    simulations = (
        PricingSimulation.query
        .filter_by(user_id=current_user.id)
        .order_by(PricingSimulation.created_at.desc())
        .all()
    )

    return jsonify({"items": [simulation.to_dict() for simulation in simulations]})


@simulations_bp.get("/<simulation_id>")
@login_required
def get_simulation(current_user: User, simulation_id: str):
    simulation = PricingSimulation.query.filter_by(id=simulation_id, user_id=current_user.id).first_or_404()
    return jsonify({"simulation": simulation.to_dict()})
