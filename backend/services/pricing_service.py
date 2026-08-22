from typing import Any

from models.pricing_simulation import PricingSimulation
from utils.validators import ValidationError, get_float, get_int, require_fields, validate_positive_number

PRICING_REQUIRED_FIELDS = [
    "project_name",
    "total_worked_hours",
    "average_hour_value",
    "desired_profit_margin",
]

ARCHITECTURE_NUCLEUS = "Arquitetura e Civil"
ARCHITECTURE_SQUARE_METER_RATES = {
    "Projeto Arquitetônico — Concepção": {1: 25, 2: 30, 3: 35},
    # A tabela de Interiores informa 30/35/40, embora as fórmulas da planilha
    # ainda apontem para 25/30/35. A tabela específica é a regra adotada.
    "Projeto Arquitetônico — Interiores": {1: 30, 2: 35, 3: 40},
    "Projeto Elétrico": {1: 25, 2: 30, 3: 35},
}


def calculate_pricing(payload: dict[str, Any], multiplier: float = 1.0) -> dict[str, Any]:
    if payload.get("nucleus") == ARCHITECTURE_NUCLEUS:
        return calculate_architecture_pricing(payload)

    validate_pricing_payload(payload)

    total_hours = get_float(payload, "total_worked_hours")
    hour_value = get_float(payload, "average_hour_value")
    margin = get_float(payload, "desired_profit_margin")
    taxes = get_float(payload, "taxes_percentage", get_float(payload, "taxes"))
    extra_costs = get_float(payload, "extra_costs")
    service_multiplier = get_float(payload, "service_multiplier", 1.0)

    base_cost = total_hours * hour_value
    value_with_margin = base_cost * (1 + margin / 100)
    value_with_taxes = value_with_margin * (1 + taxes / 100)
    combined_multiplier = multiplier * service_multiplier
    final_price = (value_with_taxes * combined_multiplier) + extra_costs

    return {
        "base_cost": round(base_cost, 2),
        "value_with_margin": round(value_with_margin, 2),
        "value_with_taxes": round(value_with_taxes, 2),
        "final_price": round(final_price, 2),
        "minimum_price": round(final_price * 0.9, 2),
        "ideal_price": round(final_price, 2),
        "premium_price": round(final_price * 1.1, 2),
        "complexity_multiplier": round(multiplier, 2),
        "service_multiplier": round(service_multiplier, 4),
        "combined_multiplier": round(combined_multiplier, 4),
        "breakdown": {
            "hours": total_hours,
            "hour_value": hour_value,
            "desired_profit_margin": margin,
            "taxes_percentage": taxes,
            "extra_costs": extra_costs,
            "formula": "((hours * hour_value) * margin) * taxes * complexity * service_variables + extra_costs",
        },
    }


def calculate_architecture_pricing(payload: dict[str, Any]) -> dict[str, Any]:
    required_fields = [
        "project_name",
        "service",
        "sheet_areas",
        "finish_level",
        "consultants_count",
        "average_hour_value",
        "hours_per_consultant",
    ]
    require_fields(payload, required_fields)

    service = payload["service"]
    if service not in ARCHITECTURE_SQUARE_METER_RATES:
        raise ValidationError(f"Invalid architecture service: received {service}")

    try:
        finish_level_value = float(payload["finish_level"])
    except (TypeError, ValueError) as error:
        raise ValidationError("Invalid finish_level: expected 1, 2 or 3") from error

    if finish_level_value not in (1, 2, 3):
        raise ValidationError("Invalid finish_level: expected 1, 2 or 3")

    finish_level = int(finish_level_value)

    sheet_areas = payload["sheet_areas"]
    if not isinstance(sheet_areas, list) or not sheet_areas:
        raise ValidationError("Invalid sheet_areas: expected a non-empty list")

    try:
        normalized_areas = [float(area) for area in sheet_areas]
    except (TypeError, ValueError) as error:
        raise ValidationError("Invalid sheet_areas: expected non-negative numbers") from error

    if any(area < 0 for area in normalized_areas):
        raise ValidationError("Invalid sheet_areas: expected non-negative numbers")

    numeric_fields = [
        "consultants_count",
        "average_hour_value",
        "hours_per_consultant",
        "transport_cost",
        "professor_art_cost",
        "art_issuance_cost",
        "taxes_percentage",
        "taxes",
        "extra_costs",
    ]
    for field in numeric_fields:
        validate_positive_number(payload, field)

    square_meter_rate = ARCHITECTURE_SQUARE_METER_RATES[service][finish_level]
    total_square_meters = sum(normalized_areas)
    consultant_labor_cost = (
        get_float(payload, "average_hour_value")
        * get_float(payload, "consultants_count")
        * get_float(payload, "hours_per_consultant")
    )
    indirect_costs = (
        get_float(payload, "transport_cost")
        + get_float(payload, "professor_art_cost")
        + get_float(payload, "art_issuance_cost")
        + get_float(payload, "extra_costs")
    )
    total_cost = consultant_labor_cost + indirect_costs
    area_value = total_square_meters * square_meter_rate
    gross_value = area_value + total_cost
    taxes = get_float(payload, "taxes_percentage", get_float(payload, "taxes"))
    tax_amount = gross_value * (taxes / 100)
    net_value = gross_value - tax_amount

    return {
        "pricing_method": "architecture_spreadsheet",
        "sheet_count": len(normalized_areas),
        "total_square_meters": round(total_square_meters, 2),
        "square_meter_rate": round(square_meter_rate, 2),
        "area_value": round(area_value, 2),
        "consultant_labor_cost": round(consultant_labor_cost, 2),
        "indirect_costs": round(indirect_costs, 2),
        "total_cost": round(total_cost, 2),
        "gross_value": round(gross_value, 2),
        "tax_amount": round(tax_amount, 2),
        "net_value": round(net_value, 2),
        "final_price": round(gross_value, 2),
        "breakdown": {
            "finish_level": finish_level,
            "sheet_areas": normalized_areas,
            "taxes_percentage": taxes,
            "formula": "gross = (sum(sheet_areas) * square_meter_rate) + indirect_costs + (hour_value * consultants * hours_per_consultant); net = gross - tax",
        },
    }


def validate_pricing_payload(payload: dict[str, Any]) -> None:
    require_fields(payload, PRICING_REQUIRED_FIELDS)

    for field in get_pricing_numeric_fields():
        validate_positive_number(payload, field)


def build_pricing_simulation(user_id, payload: dict[str, Any], related_ids: dict, multiplier: float) -> PricingSimulation:
    calculation = calculate_pricing(payload, multiplier)

    return PricingSimulation(
        user_id=user_id,
        nucleus_id=related_ids["nucleus_id"],
        service_id=related_ids["service_id"],
        complexity_id=related_ids["complexity_id"],
        project_name=payload.get("project_name"),
        client_name=payload.get("client_name"),
        context=payload.get("context"),
        total_worked_hours=get_float(payload, "total_worked_hours"),
        consultants_count=get_int(payload, "consultants_count") if payload.get("consultants_count") not in (None, "") else None,
        weekly_hours_average=get_float(payload, "weekly_hours_average") if payload.get("weekly_hours_average") not in (None, "") else None,
        average_hour_value=get_float(payload, "average_hour_value"),
        desired_profit_margin=get_float(payload, "desired_profit_margin"),
        taxes_percentage=get_float(payload, "taxes_percentage", get_float(payload, "taxes")),
        extra_costs=get_float(payload, "extra_costs"),
        base_cost=calculation["base_cost"],
        value_with_margin=calculation["value_with_margin"],
        value_with_taxes=calculation["value_with_taxes"],
        final_price=calculation["final_price"],
        minimum_price=calculation["minimum_price"],
        ideal_price=calculation["ideal_price"],
        premium_price=calculation["premium_price"],
    )


def get_pricing_numeric_fields() -> list[str]:
    return [
        "total_worked_hours",
        "average_hour_value",
        "desired_profit_margin",
        "taxes_percentage",
        "taxes",
        "extra_costs",
        "consultants_count",
        "weekly_hours_average",
        "service_multiplier",
    ]
