from sqlalchemy import func

from extensions import db
from models.complexity import ComplexityLevel
from models.historical_project import HistoricalProject
from models.nucleus import Nucleus
from models.service import Service
from utils.helpers import decimal_to_float


def build_overview(user_id) -> dict:
    projects = HistoricalProject.query.filter_by(created_by=user_id).all()

    return {
        "total_projects": len(projects),
        "average_ticket": calculate_average_ticket(projects),
        "average_ticket_by_nucleus": average_ticket_by_nucleus(user_id),
        "average_ticket_by_service": average_ticket_by_service(user_id),
        "average_complexity": calculate_average_complexity(projects),
        "average_execution_time": calculate_average_execution_time(projects),
        "distribution_by_nucleus": count_by_nucleus(user_id),
        "distribution_by_complexity": count_by_complexity(user_id),
    }


def calculate_average_ticket(projects: list[HistoricalProject]) -> float:
    charged_values = [decimal_to_float(project.charged_value) or 0 for project in projects if project.charged_value is not None]

    if not charged_values:
        return 0

    return round(sum(charged_values) / len(charged_values), 2)


def calculate_average_complexity(projects: list[HistoricalProject]) -> dict:
    multipliers = [
        decimal_to_float(project.complexity.multiplier) or 0
        for project in projects
        if project.complexity is not None
    ]

    if not multipliers:
        return {"multiplier": 0, "label": "Sem dados"}

    average_multiplier = sum(multipliers) / len(multipliers)

    return {
        "multiplier": round(average_multiplier, 2),
        "label": find_closest_complexity_label(average_multiplier),
    }


def calculate_average_execution_time(projects: list[HistoricalProject]) -> float:
    execution_times = [decimal_to_float(project.execution_time) or 0 for project in projects if project.execution_time is not None]

    if not execution_times:
        return 0

    return round(sum(execution_times) / len(execution_times), 2)


def average_ticket_by_nucleus(user_id) -> list[dict]:
    rows = (
        db.session.query(Nucleus.name, func.avg(HistoricalProject.charged_value))
        .join(HistoricalProject, HistoricalProject.nucleus_id == Nucleus.id)
        .filter(HistoricalProject.created_by == user_id)
        .group_by(Nucleus.name)
        .order_by(Nucleus.name.asc())
        .all()
    )
    return [{"label": name, "average_ticket": round(float(value or 0), 2)} for name, value in rows]


def average_ticket_by_service(user_id) -> list[dict]:
    rows = (
        db.session.query(Nucleus.name, Service.name, func.avg(HistoricalProject.charged_value))
        .join(Service, HistoricalProject.service_id == Service.id)
        .join(Nucleus, HistoricalProject.nucleus_id == Nucleus.id)
        .filter(HistoricalProject.created_by == user_id)
        .group_by(Nucleus.name, Service.name)
        .order_by(Nucleus.name.asc(), Service.name.asc())
        .all()
    )
    return [
        {"nucleus": nucleus, "service": service, "average_ticket": round(float(value or 0), 2)}
        for nucleus, service, value in rows
    ]


def count_by_nucleus(user_id) -> list[dict]:
    rows = (
        db.session.query(Nucleus.name, func.count(HistoricalProject.id))
        .join(HistoricalProject, HistoricalProject.nucleus_id == Nucleus.id)
        .filter(HistoricalProject.created_by == user_id)
        .group_by(Nucleus.name)
        .order_by(Nucleus.name.asc())
        .all()
    )
    return [{"label": name, "count": count} for name, count in rows]


def count_by_complexity(user_id) -> list[dict]:
    rows = (
        db.session.query(ComplexityLevel.name, func.count(HistoricalProject.id))
        .join(HistoricalProject, HistoricalProject.complexity_id == ComplexityLevel.id)
        .filter(HistoricalProject.created_by == user_id)
        .group_by(ComplexityLevel.name)
        .order_by(ComplexityLevel.name.asc())
        .all()
    )
    return [{"label": name, "count": count} for name, count in rows]


def find_closest_complexity_label(multiplier: float) -> str:
    multipliers = {
        "Muito baixa": 0.85,
        "Baixa": 0.95,
        "Média": 1.00,
        "Alta": 1.15,
        "Muito alta": 1.35,
    }
    return min(multipliers, key=lambda label: abs(multipliers[label] - multiplier))
