import unittest
from dataclasses import replace
from datetime import date

from app import create_app
from config import TestConfig
from extensions import db
from models.complexity import ComplexityLevel
from models.historical_project import HistoricalProject
from models.nucleus import Nucleus
from models.service import Service
from models.user import User
from services.historical_import_service import HistoricalProjectRecord
from services.historical_pricing_service import get_historical_suggestion
from services.historical_storage_service import upsert_historical_projects


class HistoricalStorageServiceTest(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        self.user = User(name="Importador", email="importador@mauajr.com")
        self.user.set_password("test-password")
        self.nucleus = Nucleus(name="Tecnologia")
        self.complexity = ComplexityLevel(name="Alta", multiplier=1.15)
        db.session.add_all([self.user, self.nucleus, self.complexity])
        db.session.flush()
        self.service = Service(
            nucleus_id=self.nucleus.id,
            name="Desenvolvimento de Sistemas",
        )
        db.session.add(self.service)
        db.session.commit()

    def tearDown(self) -> None:
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_upsert_is_idempotent_by_source_id(self) -> None:
        record = HistoricalProjectRecord(
            source_id="HIST-100",
            area="Tecnologia",
            costs={"transport_cost": 200},
            final_price=12000,
            project_date=date(2026, 7, 1),
            project_name="Portal interno",
            service="Desenvolvimento de Sistemas",
            complexity="Alta",
        )

        first_report = upsert_historical_projects(
            [record],
            created_by=self.user.id,
            source_file="historico.csv",
        )
        db.session.commit()
        second_report = upsert_historical_projects(
            [replace(record, final_price=13500)],
            created_by=self.user.id,
            source_file="historico.csv",
        )
        db.session.commit()

        self.assertEqual(1, first_report.created_count)
        self.assertEqual(1, second_report.updated_count)
        self.assertEqual(1, HistoricalProject.query.count())
        project = HistoricalProject.query.one()
        self.assertEqual(13500, float(project.charged_value))
        self.assertEqual({"transport_cost": 200}, project.costs_json)
        suggestion = get_historical_suggestion("Tecnologia")
        self.assertEqual(13500, suggestion["median_price"])


if __name__ == "__main__":
    unittest.main()
