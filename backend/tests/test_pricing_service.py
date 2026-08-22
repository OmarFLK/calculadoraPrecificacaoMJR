import unittest

from services.pricing_service import calculate_architecture_pricing, calculate_pricing


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

    def test_reproduces_architecture_conception_spreadsheet(self) -> None:
        result = calculate_architecture_pricing(
            {
                "project_name": "Projeto arquitetônico",
                "service": "Projeto Arquitetônico — Concepção",
                "sheet_areas": [150, 150, 150],
                "finish_level": 3,
                "consultants_count": 2,
                "average_hour_value": 210,
                "hours_per_consultant": 10,
                "transport_cost": 200,
                "professor_art_cost": 750,
                "art_issuance_cost": 150,
                "taxes_percentage": 14,
            }
        )

        self.assertEqual(5300, result["total_cost"])
        self.assertEqual(21050, result["gross_value"])
        self.assertEqual(2947, result["tax_amount"])
        self.assertEqual(18103, result["net_value"])

    def test_uses_interiors_rate_table_instead_of_stale_cell_formula(self) -> None:
        result = calculate_architecture_pricing(
            {
                "project_name": "Projeto de interiores",
                "service": "Projeto Arquitetônico — Interiores",
                "sheet_areas": [15, 15, 15],
                "finish_level": 1,
                "consultants_count": 2,
                "average_hour_value": 210,
                "hours_per_consultant": 5,
                "transport_cost": 200,
                "professor_art_cost": 750,
                "art_issuance_cost": 150,
                "taxes_percentage": 10,
            }
        )

        self.assertEqual(30, result["square_meter_rate"])
        self.assertEqual(4550, result["gross_value"])
        self.assertEqual(4095, result["net_value"])


if __name__ == "__main__":
    unittest.main()
