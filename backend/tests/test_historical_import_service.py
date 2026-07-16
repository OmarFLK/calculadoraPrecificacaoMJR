import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from services.historical_import_service import import_historical_file

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
ALIASES_PATH = REPOSITORY_ROOT / "data" / "historico" / "aliases.json"
TEST_DIRECTORY = Path(__file__).resolve().parent


class HistoricalImportServiceTest(unittest.TestCase):
    def test_imports_csv_and_reports_invalid_rows(self) -> None:
        csv_content = (
            "id_projeto;area;preco_final;data;custo_transporte\n"
            "A-1;Quimica e Alimentos;R$ 1.250,50;16/07/2026;R$ 120,00\n"
            "A-2;Tecnologia;;2026-07-16;50\n"
        )

        with tempfile.TemporaryDirectory(dir=TEST_DIRECTORY) as temporary_directory:
            source = Path(temporary_directory) / "historico.csv"
            source.write_text(csv_content, encoding="utf-8")
            report = import_historical_file(source, ALIASES_PATH)

        self.assertEqual(2, report.total_rows)
        self.assertEqual(1, len(report.records))
        self.assertEqual(1, len(report.issues))
        self.assertEqual(1250.5, report.records[0].final_price)
        self.assertEqual(120.0, report.records[0].costs["transport_cost"])
        self.assertIn("precoFinalPraticado", report.issues[0].reason)

    def test_imports_xlsx_source(self) -> None:
        with tempfile.TemporaryDirectory(dir=TEST_DIRECTORY) as temporary_directory:
            source = Path(temporary_directory) / "historico.xlsx"
            workbook = Workbook()
            worksheet = workbook.active
            worksheet.append(["id", "núcleo", "valor_cobrado", "data"])
            worksheet.append(["X-1", "Design", 8400, "2026-06-01"])
            workbook.save(source)
            workbook.close()

            report = import_historical_file(source, ALIASES_PATH)

        self.assertEqual(1, len(report.records))
        self.assertEqual("Design", report.records[0].area)
        self.assertEqual(8400.0, report.records[0].final_price)

    def test_duplicate_source_id_is_reported(self) -> None:
        csv_content = (
            "id,area,preco_final,data\n"
            "DUP-1,Tecnologia,1000,2026-01-10\n"
            "DUP-1,Tecnologia,1200,2026-01-11\n"
        )

        with tempfile.TemporaryDirectory(dir=TEST_DIRECTORY) as temporary_directory:
            source = Path(temporary_directory) / "duplicados.csv"
            source.write_text(csv_content, encoding="utf-8")
            report = import_historical_file(source, ALIASES_PATH)

        self.assertEqual(1, len(report.records))
        self.assertEqual(1, len(report.issues))
        self.assertIn("duplicate project id", report.issues[0].reason)


if __name__ == "__main__":
    unittest.main()
