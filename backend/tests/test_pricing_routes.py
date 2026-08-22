import unittest

from app import create_app
from config import TestConfig
from extensions import db
from models.nucleus import Nucleus
from models.service import Service
from models.user import User
from utils.auth import create_access_token


class PricingRoutesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        user = User(name="Calculista", email="calculista@mauajr.com")
        user.set_password("senha-segura")
        nucleus = Nucleus(name="Arquitetura e Civil")
        db.session.add_all([user, nucleus])
        db.session.flush()
        db.session.add(Service(
            nucleus_id=nucleus.id,
            name="Projeto Arquitetônico — Concepção",
        ))
        db.session.commit()

        self.client = self.app.test_client()
        self.auth_headers = {"Authorization": f"Bearer {create_access_token(user)}"}

    def tearDown(self) -> None:
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_calculate_architecture_price_without_generic_complexity(self) -> None:
        response = self.client.post(
            "/pricing/calculate",
            headers=self.auth_headers,
            json={
                "project_name": "Projeto arquitetônico",
                "nucleus": "Arquitetura e Civil",
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
            },
        )

        self.assertEqual(200, response.status_code)
        self.assertEqual(21050, response.get_json()["gross_value"])
        self.assertEqual("architecture_spreadsheet", response.get_json()["pricing_method"])


if __name__ == "__main__":
    unittest.main()
