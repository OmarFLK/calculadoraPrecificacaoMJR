from extensions import db
from models.base import CreatedAtMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.db_types import GUID


class AiAnalysisLog(UUIDPrimaryKeyMixin, CreatedAtMixin, db.Model):
    __tablename__ = "ai_analysis_logs"

    user_id = db.Column(GUID(), db.ForeignKey("users.id"), nullable=False, index=True)
    simulation_id = db.Column(GUID(), db.ForeignKey("pricing_simulations.id"), index=True)
    project_id = db.Column(GUID(), db.ForeignKey("historical_projects.id"), index=True)
    prompt = db.Column(db.Text)
    response = db.Column(db.Text)
    suggested_complexity = db.Column(db.String(80))
    estimated_risk = db.Column(db.String(80))
    model_used = db.Column(db.String(120))
    input_tokens = db.Column(db.Integer)
    output_tokens = db.Column(db.Integer)

    user = db.relationship("User", back_populates="ai_analysis_logs")
    simulation = db.relationship("PricingSimulation", back_populates="ai_analysis_logs")
    project = db.relationship("HistoricalProject", back_populates="ai_analysis_logs")

    __table_args__ = (
        db.CheckConstraint("input_tokens IS NULL OR input_tokens >= 0", name="ck_ai_analysis_logs_input_tokens_non_negative"),
        db.CheckConstraint("output_tokens IS NULL OR output_tokens >= 0", name="ck_ai_analysis_logs_output_tokens_non_negative"),
    )

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "user_id": str(self.user_id),
            "simulation_id": str(self.simulation_id) if self.simulation_id else None,
            "project_id": str(self.project_id) if self.project_id else None,
            "prompt": self.prompt,
            "response": self.response,
            "suggested_complexity": self.suggested_complexity,
            "estimated_risk": self.estimated_risk,
            "model_used": self.model_used,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
        }
