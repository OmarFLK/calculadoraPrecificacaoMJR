import unittest

from services.pricing_service import calculate_pricing


class PricingServiceTest(unittest.TestCase):
    def test_combines_complexity_and_service_multipliers(self) -> None:
        result = calculate_pricing(
            {
                "project_name": "Pesquisa regional",
                "total_worked_hours": 100,
                "average_hour_value": 50,
                "desired_profit_margin": 20,
                "taxes": 10,
                "extra_costs": 300,
                "service_multiplier": 1.25,
            },
            multiplier=1.1,
        )

        self.assertEqual(9375.0, result["final_price"])
        self.assertEqual(1.25, result["service_multiplier"])
        self.assertEqual(1.375, result["combined_multiplier"])


if __name__ == "__main__":
    unittest.main()
