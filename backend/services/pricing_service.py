from typing import Any

from models.pricing_simulation import PricingSimulation
from utils.validators import get_float, get_int, require_fields, validate_positive_number

PRICING_REQUIRED_FIELDS = [
    "project_name",
    "total_worked_hours",
    "average_hour_value",
    "desired_profit_margin",
]


def calculate_pricing(payload: dict[str, Any], multiplier: float = 1.0) -> dict[str, Any]:
    validate_pricing_payload(payload)

    total_hours = get_float(payload, "total_worked_hours")
    hour_value = get_float(payload, "average_hour_value")
    margin = get_float(payload, "desired_profit_margin")
    taxes = get_float(payload, "taxes_percentage", get_float(payload, "taxes"))
    extra_costs = get_float(payload, "extra_costs")

    base_cost = total_hours * hour_value
    value_with_margin = base_cost * (1 + margin / 100)
    value_with_taxes = value_with_margin * (1 + taxes / 100)
    final_price = (value_with_taxes * multiplier) + extra_costs

    return {
        "base_cost": round(base_cost, 2),
        "value_with_margin": round(value_with_margin, 2),
        "value_with_taxes": round(value_with_taxes, 2),
        "final_price": round(final_price, 2),
        "minimum_price": round(final_price * 0.9, 2),
        "ideal_price": round(final_price, 2),
        "premium_price": round(final_price * 1.1, 2),
        "complexity_multiplier": round(multiplier, 2),
        "breakdown": {
            "hours": total_hours,
            "hour_value": hour_value,
            "desired_profit_margin": margin,
            "taxes_percentage": taxes,
            "extra_costs": extra_costs,
            "formula": "((hours * hour_value) * margin) * taxes * complexity + extra_costs",
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
    ]
