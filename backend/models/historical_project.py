from extensions import db
from models.base import TimestampMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.db_types import GUID
from utils.helpers import decimal_to_float


class HistoricalProject(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    __tablename__ = "historical_projects"

    created_by = db.Column(GUID(), db.ForeignKey("users.id"), nullable=False, index=True)
    nucleus_id = db.Column(GUID(), db.ForeignKey("nuclei.id"), nullable=False, index=True)
    service_id = db.Column(GUID(), db.ForeignKey("services.id"), index=True)
    complexity_id = db.Column(GUID(), db.ForeignKey("complexity_levels.id"), index=True)

    project_name = db.Column(db.String(180), nullable=False)
    source_id = db.Column(db.String(180))
    source_file = db.Column(db.String(255))
    project_date = db.Column(db.Date)
    client_name = db.Column(db.String(180))
    context = db.Column(db.Text)
    observations = db.Column(db.Text)
    result = db.Column(db.String(120))
    costs_json = db.Column(db.JSON, nullable=False, default=dict)

    charged_value = db.Column(db.Numeric(12, 2))
    reference_ticket = db.Column(db.Numeric(12, 2))
    average_hour_value = db.Column(db.Numeric(10, 2))
    desired_profit_margin = db.Column(db.Numeric(6, 2))
    taxes_percentage = db.Column(db.Numeric(6, 2))
    extra_costs = db.Column(db.Numeric(12, 2))

    execution_time = db.Column(db.Numeric(8, 2))
    execution_time_unit = db.Column(db.String(20), nullable=False, default="semanas")
    total_worked_hours = db.Column(db.Numeric(10, 2))
    consultants_count = db.Column(db.Integer)
    weekly_hours_average = db.Column(db.Numeric(8, 2))

    creator = db.relationship("User", back_populates="historical_projects")
    nucleus = db.relationship("Nucleus", back_populates="historical_projects")
    service = db.relationship("Service", back_populates="historical_projects")
    complexity = db.relationship("ComplexityLevel", back_populates="historical_projects")
    files = db.relationship("ProjectFile", back_populates="project", cascade="all, delete-orphan")
    ai_analysis_logs = db.relationship("AiAnalysisLog", back_populates="project")

    __table_args__ = (
        db.CheckConstraint("execution_time_unit IN ('dias', 'semanas', 'meses')", name="ck_historical_projects_time_unit"),
        db.CheckConstraint("charged_value IS NULL OR charged_value >= 0", name="ck_historical_projects_charged_value_non_negative"),
        db.CheckConstraint("reference_ticket IS NULL OR reference_ticket >= 0", name="ck_historical_projects_reference_ticket_non_negative"),
        db.CheckConstraint("average_hour_value IS NULL OR average_hour_value >= 0", name="ck_historical_projects_average_hour_value_non_negative"),
        db.CheckConstraint("desired_profit_margin IS NULL OR desired_profit_margin >= 0", name="ck_historical_projects_margin_non_negative"),
        db.CheckConstraint("taxes_percentage IS NULL OR taxes_percentage >= 0", name="ck_historical_projects_taxes_non_negative"),
        db.CheckConstraint("extra_costs IS NULL OR extra_costs >= 0", name="ck_historical_projects_extra_costs_non_negative"),
        db.CheckConstraint("execution_time IS NULL OR execution_time >= 0", name="ck_historical_projects_execution_time_non_negative"),
        db.CheckConstraint("total_worked_hours IS NULL OR total_worked_hours >= 0", name="ck_historical_projects_hours_non_negative"),
        db.CheckConstraint("consultants_count IS NULL OR consultants_count >= 0", name="ck_historical_projects_consultants_non_negative"),
        db.CheckConstraint("weekly_hours_average IS NULL OR weekly_hours_average >= 0", name="ck_historical_projects_weekly_hours_non_negative"),
        db.Index("ix_historical_projects_charged_value", "charged_value"),
        db.Index("ix_historical_projects_created_at", "created_at"),
        db.Index("ix_historical_projects_project_date", "project_date"),
        db.UniqueConstraint(
            "created_by",
            "source_id",
            name="uq_historical_projects_creator_source_id",
        ),
    )

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "created_by": str(self.created_by),
            "nucleus_id": str(self.nucleus_id),
            "service_id": str(self.service_id) if self.service_id else None,
            "complexity_id": str(self.complexity_id) if self.complexity_id else None,
            "project_name": self.project_name,
            "source_id": self.source_id,
            "source_file": self.source_file,
            "project_date": self.project_date.isoformat() if self.project_date else None,
            "client_name": self.client_name,
            "context": self.context,
            "observations": self.observations,
            "result": self.result,
            "costs": self.costs_json,
            "charged_value": decimal_to_float(self.charged_value),
            "reference_ticket": decimal_to_float(self.reference_ticket),
            "average_hour_value": decimal_to_float(self.average_hour_value),
            "desired_profit_margin": decimal_to_float(self.desired_profit_margin),
            "taxes_percentage": decimal_to_float(self.taxes_percentage),
            "extra_costs": decimal_to_float(self.extra_costs),
            "execution_time": decimal_to_float(self.execution_time),
            "execution_time_unit": self.execution_time_unit,
            "total_worked_hours": decimal_to_float(self.total_worked_hours),
            "consultants_count": self.consultants_count,
            "weekly_hours_average": decimal_to_float(self.weekly_hours_average),
        }
