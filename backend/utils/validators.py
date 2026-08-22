import re
from typing import Any

VALID_NUCLEI = {
    "Tecnologia",
    "Gestão Empresarial",
    "Design",
    "Gestão de Processos",
    "Química e Alimentos",
    "Arquitetura e Civil",
}

VALID_COMPLEXITIES = {
    "Muito baixa",
    "Baixa",
    "Média",
    "Alta",
    "Muito alta",
}

VALID_TIME_UNITS = {"dias", "semanas", "meses"}

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ValidationError(ValueError):
    pass


def require_fields(payload: dict[str, Any], fields: list[str]) -> None:
    missing_fields = [field for field in fields if payload.get(field) in (None, "")]

    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")


def validate_email(email: object) -> None:
    if not isinstance(email, str) or not EMAIL_PATTERN.match(email.strip()):
        raise ValidationError(f"Invalid email: received {email}")


def validate_positive_number(payload: dict[str, Any], field: str, required: bool = False) -> None:
    value = payload.get(field)

    if value in (None, "") and not required:
        return

    if value in (None, ""):
        raise ValidationError(f"Missing required numeric field: {field}")

    try:
        numeric_value = float(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"Invalid numeric field {field}: received {value}") from exc

    if numeric_value < 0:
        raise ValidationError(f"Invalid numeric field {field}: expected a positive number")


def validate_enum(value: str | None, valid_values: set[str], field: str, required: bool = False) -> None:
    if value in (None, "") and not required:
        return

    if value not in valid_values:
        allowed_values = ", ".join(sorted(valid_values))
        raise ValidationError(f"Invalid {field}: expected one of {allowed_values}")


def get_float(payload: dict[str, Any], field: str, default: float = 0) -> float:
    value = payload.get(field, default)

    if value in (None, ""):
        return default

    return float(value)


def get_int(payload: dict[str, Any], field: str, default: int = 0) -> int:
    value = payload.get(field, default)

    if value in (None, ""):
        return default

    return int(value)
