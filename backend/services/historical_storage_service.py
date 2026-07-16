from dataclasses import dataclass, field
from pathlib import Path

from extensions import db
from models.complexity import ComplexityLevel
from models.historical_project import HistoricalProject
from models.nucleus import Nucleus
from models.service import Service
from services.historical_import_service import HistoricalProjectRecord


@dataclass(frozen=True)
class StorageIssue:
    source_id: str
    reason: str


@dataclass
class HistoricalStorageReport:
    created_count: int = 0
    updated_count: int = 0
    issues: list[StorageIssue] = field(default_factory=list)

    @property
    def stored_count(self) -> int:
        return self.created_count + self.updated_count


def upsert_historical_projects(
    records: list[HistoricalProjectRecord],
    *,
    created_by,
    source_file: str | Path,
) -> HistoricalStorageReport:
    report = HistoricalStorageReport()
    source_name = Path(source_file).name

    for record in records:
        nucleus = Nucleus.query.filter_by(name=record.area).first()
        if nucleus is None:
            report.issues.append(
                StorageIssue(record.source_id, f"area is not seeded in database: {record.area}")
            )
            continue

        service = resolve_optional_service(record.service, nucleus)
        if record.service and service is None:
            report.issues.append(
                StorageIssue(record.source_id, f"service is not valid for {record.area}: {record.service}")
            )
            continue

        complexity = resolve_optional_complexity(record.complexity)
        if record.complexity and complexity is None:
            report.issues.append(
                StorageIssue(record.source_id, f"complexity is not seeded: {record.complexity}")
            )
            continue

        project = HistoricalProject.query.filter_by(
            created_by=created_by,
            source_id=record.source_id,
        ).first()
        if project is None:
            project = HistoricalProject(created_by=created_by, source_id=record.source_id)
            db.session.add(project)
            report.created_count += 1
        else:
            report.updated_count += 1

        apply_record(project, record, nucleus, service, complexity, source_name)

    db.session.flush()
    return report


def resolve_optional_service(service_name: str, nucleus: Nucleus) -> Service | None:
    if not service_name:
        return None
    return Service.query.filter_by(nucleus_id=nucleus.id, name=service_name).first()


def resolve_optional_complexity(complexity_name: str) -> ComplexityLevel | None:
    if not complexity_name:
        return None
    return ComplexityLevel.query.filter_by(name=complexity_name).first()


def apply_record(
    project: HistoricalProject,
    record: HistoricalProjectRecord,
    nucleus: Nucleus,
    service: Service | None,
    complexity: ComplexityLevel | None,
    source_name: str,
) -> None:
    project.nucleus_id = nucleus.id
    project.service_id = service.id if service else None
    project.complexity_id = complexity.id if complexity else None
    project.project_name = record.project_name or record.source_id
    project.source_file = source_name
    project.project_date = record.project_date
    project.costs_json = record.costs
    project.charged_value = record.final_price
    project.extra_costs = sum(record.costs.values())
    project.result = record.result or None
    project.observations = record.observations or None
