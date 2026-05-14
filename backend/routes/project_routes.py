from flask import Blueprint, jsonify, request

from extensions import db
from models.complexity import ComplexityLevel
from models.historical_project import HistoricalProject
from models.nucleus import Nucleus
from models.service import Service
from models.user import User
from services.catalog_service import resolve_pricing_relations
from utils.auth import login_required
from utils.validators import (
    VALID_TIME_UNITS,
    get_float,
    get_int,
    require_fields,
    validate_enum,
    validate_positive_number,
)

project_bp = Blueprint("projects", __name__)


@project_bp.get("")
@login_required
def list_projects(current_user: User):
    query = HistoricalProject.query.filter_by(created_by=current_user.id)
    query = apply_project_filters(query)

    page = max(request.args.get("page", default=1, type=int), 1)
    per_page = min(max(request.args.get("per_page", default=20, type=int), 1), 100)
    pagination = query.order_by(HistoricalProject.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "items": [project.to_dict() for project in pagination.items],
        "pagination": {
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
        },
    })


@project_bp.get("/<project_id>")
@login_required
def get_project(current_user: User, project_id: str):
    project = find_user_project_or_404(current_user.id, project_id)
    return jsonify({"project": project.to_dict()})


@project_bp.post("")
@login_required
def create_project(current_user: User):
    payload = request.get_json(silent=True) or {}
    validate_project_payload(payload)

    project = HistoricalProject(created_by=current_user.id)
    apply_project_payload(project, payload)
    db.session.add(project)
    db.session.commit()

    return jsonify({"project": project.to_dict()}), 201


@project_bp.put("/<project_id>")
@login_required
def update_project(current_user: User, project_id: str):
    payload = request.get_json(silent=True) or {}
    project = find_user_project_or_404(current_user.id, project_id)
    validate_project_payload(payload, partial=True)
    apply_project_payload(project, payload)
    db.session.commit()

    return jsonify({"project": project.to_dict()})


@project_bp.delete("/<project_id>")
@login_required
def delete_project(current_user: User, project_id: str):
    project = find_user_project_or_404(current_user.id, project_id)
    db.session.delete(project)
    db.session.commit()

    return jsonify({"deleted": True})


def apply_project_filters(query):
    if request.args.get("nucleus"):
        query = query.join(Nucleus).filter(Nucleus.name == request.args["nucleus"])

    if request.args.get("service"):
        query = query.join(Service).filter(Service.name == request.args["service"])

    if request.args.get("complexity"):
        query = query.join(ComplexityLevel).filter(ComplexityLevel.name == request.args["complexity"])

    if request.args.get("min_value"):
        query = query.filter(HistoricalProject.charged_value >= float(request.args["min_value"]))

    if request.args.get("max_value"):
        query = query.filter(HistoricalProject.charged_value <= float(request.args["max_value"]))

    return query


def find_user_project_or_404(user_id, project_id: str) -> HistoricalProject:
    return HistoricalProject.query.filter_by(id=project_id, created_by=user_id).first_or_404()


def validate_project_payload(payload: dict, partial: bool = False) -> None:
    required_fields = [] if partial else ["project_name"]
    require_fields(payload, required_fields)
    validate_enum(payload.get("execution_time_unit"), VALID_TIME_UNITS, "execution_time_unit")

    for field in get_project_numeric_fields():
        validate_positive_number(payload, field)


def apply_project_payload(project: HistoricalProject, payload: dict) -> None:
    if should_update_relations(payload, project):
        relations = resolve_pricing_relations(payload)
        project.nucleus_id = relations["nucleus_id"]
        project.service_id = relations["service_id"]
        project.complexity_id = relations["complexity_id"]

    for field in get_project_text_fields():
        if field in payload:
            setattr(project, field, payload.get(field))

    for field in get_project_numeric_fields():
        if field in payload:
            setattr(project, field, get_float(payload, field))

    if "consultants_count" in payload:
        project.consultants_count = get_int(payload, "consultants_count")


def should_update_relations(payload: dict, project: HistoricalProject) -> bool:
    has_relation_payload = any(key in payload for key in ["nucleus", "nucleus_id", "service", "service_id", "complexity", "complexity_id"])
    return has_relation_payload or project.nucleus_id is None


def get_project_text_fields() -> list[str]:
    return ["project_name", "client_name", "context", "observations", "execution_time_unit"]


def get_project_numeric_fields() -> list[str]:
    return [
        "charged_value",
        "reference_ticket",
        "execution_time",
        "total_worked_hours",
        "consultants_count",
        "weekly_hours_average",
        "average_hour_value",
        "desired_profit_margin",
        "taxes_percentage",
        "extra_costs",
    ]
