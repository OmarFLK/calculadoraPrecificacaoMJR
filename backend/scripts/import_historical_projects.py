import argparse
import os
import sys
from pathlib import Path

from sqlalchemy.exc import SQLAlchemyError

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = BACKEND_ROOT.parent
sys.path.insert(0, str(BACKEND_ROOT))

from app import create_app
from extensions import db
from models.user import User
from services.historical_import_service import HistoricalImportError, import_historical_file
from services.historical_storage_service import upsert_historical_projects


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Import historical pricing projects")
    parser.add_argument("source", help="CSV or XLSX source file")
    parser.add_argument(
        "--aliases",
        default=str(REPOSITORY_ROOT / "data" / "historico" / "aliases.json"),
        help="Editable field alias map",
    )
    parser.add_argument(
        "--user-email",
        default=os.getenv("HISTORICAL_IMPORT_USER_EMAIL", "teste@mauajr.com"),
        help="Existing user that owns imported records",
    )
    return parser.parse_args()


def main() -> int:
    arguments = parse_arguments()
    try:
        import_report = import_historical_file(arguments.source, arguments.aliases)
    except HistoricalImportError as error:
        print(f"Import failed: {error}")
        return 1

    for issue in import_report.issues:
        print(f"Row {issue.row_number} ignored: {issue.reason}")
    print(import_report.summary)

    if not import_report.records:
        return 1

    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=arguments.user_email).first()
        if user is None:
            print(f"Import failed: user not found: {arguments.user_email}")
            return 1

        try:
            storage_report = upsert_historical_projects(
                import_report.records,
                created_by=user.id,
                source_file=arguments.source,
            )
            db.session.commit()
        except SQLAlchemyError as error:
            db.session.rollback()
            print(f"Import failed while writing database records: {error}")
            return 1

        for issue in storage_report.issues:
            print(f"Project {issue.source_id} ignored: {issue.reason}")

        print(
            f"Database: {storage_report.created_count} created, "
            f"{storage_report.updated_count} updated, "
            f"{len(storage_report.issues)} ignored"
        )
        return 0 if storage_report.stored_count else 1


if __name__ == "__main__":
    raise SystemExit(main())
