from extensions import db
from models.base import CreatedAtMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.db_types import GUID
from utils.helpers import decimal_to_float


class PricingSimulation(UUIDPrimaryKeyMixin, CreatedAtMixin, db.Model):
    __tablename__ = "pricing_simulations"

    user_id = db.Column(GUID(), db.ForeignKey("users.id"), nullable=False, index=True)
    nucleus_id = db.Column(GUID(), db.ForeignKey("nuclei.id"), nullable=False, index=True)
    service_id = db.Column(GUID(), db.ForeignKey("services.id"), nullable=False, index=True)
    complexity_id = db.Column(GUID(), db.ForeignKey("complexity_levels.id"), nullable=False, index=True)

    project_name = db.Column(db.String(180))
    client_name = db.Column(db.String(180))
    context = db.Column(db.Text)

    total_worked_hours = db.Column(db.Numeric(10, 2), nullable=False)
    consultants_count = db.Column(db.Integer)
    weekly_hours_average = db.Column(db.Numeric(8, 2))
    average_hour_value = db.Column(db.Numeric(10, 2), nullable=False)
    desired_profit_margin = db.Column(db.Numeric(6, 2), nullable=False)
    taxes_percentage = db.Column(db.Numeric(6, 2), nullable=False, default=0)
    extra_costs = db.Column(db.Numeric(12, 2), nullable=False, default=0)

    base_cost = db.Column(db.Numeric(12, 2))
    value_with_margin = db.Column(db.Numeric(12, 2))
    value_with_taxes = db.Column(db.Numeric(12, 2))
    final_price = db.Column(db.Numeric(12, 2), index=True)
    minimum_price = db.Column(db.Numeric(12, 2))
    ideal_price = db.Column(db.Numeric(12, 2))
    premium_price = db.Column(db.Numeric(12, 2))

    user = db.relationship("User", back_populates="pricing_simulations")
    nucleus = db.relationship("Nucleus", back_populates="pricing_simulations")
    service = db.relationship("Service", back_populates="pricing_simulations")
    complexity = db.relationship("ComplexityLevel", back_populates="pricing_simulations")
    ai_analysis_logs = db.relationship("AiAnalysisLog", back_populates="simulation")

    __table_args__ = (
        db.CheckConstraint("total_worked_hours >= 0", name="ck_pricing_simulations_hours_non_negative"),
        db.CheckConstraint("consultants_count IS NULL OR consultants_count >= 0", name="ck_pricing_simulations_consultants_non_negative"),
        db.CheckConstraint("weekly_hours_average IS NULL OR weekly_hours_average >= 0", name="ck_pricing_simulations_weekly_hours_non_negative"),
        db.CheckConstraint("average_hour_value >= 0", name="ck_pricing_simulations_average_hour_value_non_negative"),
        db.CheckConstraint("desired_profit_margin >= 0", name="ck_pricing_simulations_margin_non_negative"),
        db.CheckConstraint("taxes_percentage >= 0", name="ck_pricing_simulations_taxes_non_negative"),
        db.CheckConstraint("extra_costs >= 0", name="ck_pricing_simulations_extra_costs_non_negative"),
        db.Index("ix_pricing_simulations_created_at", "created_at"),
    )

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "user_id": str(self.user_id),
            "nucleus_id": str(self.nucleus_id),
            "service_id": str(self.service_id),
            "complexity_id": str(self.complexity_id),
            "project_name": self.project_name,
            "client_name": self.client_name,
            "context": self.context,
            "total_worked_hours": decimal_to_float(self.total_worked_hours),
            "consultants_count": self.consultants_count,
            "weekly_hours_average": decimal_to_float(self.weekly_hours_average),
            "average_hour_value": decimal_to_float(self.average_hour_value),
            "desired_profit_margin": decimal_to_float(self.desired_profit_margin),
            "taxes_percentage": decimal_to_float(self.taxes_percentage),
            "extra_costs": decimal_to_float(self.extra_costs),
            "base_cost": decimal_to_float(self.base_cost),
            "value_with_margin": decimal_to_float(self.value_with_margin),
            "value_with_taxes": decimal_to_float(self.value_with_taxes),
            "final_price": decimal_to_float(self.final_price),
            "minimum_price": decimal_to_float(self.minimum_price),
            "ideal_price": decimal_to_float(self.ideal_price),
            "premium_price": decimal_to_float(self.premium_price),
        }
