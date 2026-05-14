from extensions import db
from models.base import CreatedAtMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.helpers import decimal_to_float


class ComplexityLevel(UUIDPrimaryKeyMixin, CreatedAtMixin, db.Model):
    __tablename__ = "complexity_levels"

    name = db.Column(db.String(80), nullable=False, unique=True)
    multiplier = db.Column(db.Numeric(5, 2), nullable=False)
    description = db.Column(db.Text)

    historical_projects = db.relationship("HistoricalProject", back_populates="complexity")
    pricing_simulations = db.relationship("PricingSimulation", back_populates="complexity")

    __table_args__ = (
        db.CheckConstraint("multiplier >= 0", name="ck_complexity_levels_multiplier_non_negative"),
    )

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "name": self.name,
            "multiplier": decimal_to_float(self.multiplier),
            "description": self.description,
        }
