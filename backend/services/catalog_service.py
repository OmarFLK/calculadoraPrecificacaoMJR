from models.complexity import ComplexityLevel
from models.nucleus import Nucleus
from models.service import Service
from utils.validators import ValidationError


def resolve_nucleus(payload: dict) -> Nucleus:
    nucleus_id = payload.get("nucleus_id")
    nucleus_name = payload.get("nucleus")

    query = Nucleus.query
    nucleus = query.get(nucleus_id) if nucleus_id else query.filter_by(name=nucleus_name).first()

    if nucleus is None:
        raise ValidationError("Invalid nucleus: expected existing nucleus_id or nucleus name")

    return nucleus


def resolve_service(payload: dict, nucleus: Nucleus) -> Service:
    service_id = payload.get("service_id")
    service_name = payload.get("service")

    query = Service.query.filter_by(nucleus_id=nucleus.id)
    service = Service.query.get(service_id) if service_id else query.filter_by(name=service_name).first()

    if service is None or service.nucleus_id != nucleus.id:
        raise ValidationError("Invalid service: expected service from selected nucleus")

    return service


def resolve_complexity(payload: dict) -> ComplexityLevel:
    complexity_id = payload.get("complexity_id")
    complexity_name = payload.get("complexity")

    query = ComplexityLevel.query
    complexity = query.get(complexity_id) if complexity_id else query.filter_by(name=complexity_name).first()

    if complexity is None:
        raise ValidationError("Invalid complexity: expected existing complexity_id or complexity name")

    return complexity


def resolve_pricing_relations(payload: dict) -> dict:
    nucleus = resolve_nucleus(payload)
    service = resolve_service(payload, nucleus)
    complexity = resolve_complexity(payload)

    return {
        "nucleus_id": nucleus.id,
        "service_id": service.id,
        "complexity_id": complexity.id,
        "complexity_multiplier": float(complexity.multiplier),
    }
