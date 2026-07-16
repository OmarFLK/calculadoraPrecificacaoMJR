from statistics import median
from typing import Iterable

from models.historical_project import HistoricalProject
from models.nucleus import Nucleus


def calculate_historical_suggestion(
    area: str,
    prices: Iterable[float],
) -> dict:
    normalized_prices = sorted(float(price) for price in prices)
    if not normalized_prices:
        return {
            "area": area,
            "method": "median",
            "sample_count": 0,
            "median_price": None,
            "minimum_price": None,
            "maximum_price": None,
        }

    return {
        "area": area,
        "method": "median",
        "sample_count": len(normalized_prices),
        "median_price": round(median(normalized_prices), 2),
        "minimum_price": round(normalized_prices[0], 2),
        "maximum_price": round(normalized_prices[-1], 2),
    }


def get_historical_suggestion(area: str) -> dict:
    prices = (
        HistoricalProject.query
        .join(Nucleus)
        .filter(Nucleus.name == area, HistoricalProject.charged_value.isnot(None))
        .with_entities(HistoricalProject.charged_value)
        .all()
    )
    return calculate_historical_suggestion(
        area,
        (float(row.charged_value) for row in prices),
    )
