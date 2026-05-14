from extensions import db
from models.base import CreatedAtMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.db_types import GUID


class Service(UUIDPrimaryKeyMixin, CreatedAtMixin, db.Model):
    __tablename__ = "services"

    nucleus_id = db.Column(GUID(), db.ForeignKey("nuclei.id"), nullable=False, index=True)
    name = db.Column(db.String(160), nullable=False)
    description = db.Column(db.Text)
    active = db.Column(db.Boolean, nullable=False, default=True)

    nucleus = db.relationship("Nucleus", back_populates="services")
    historical_projects = db.relationship("HistoricalProject", back_populates="service")
    pricing_simulations = db.relationship("PricingSimulation", back_populates="service")

    __table_args__ = (
        db.UniqueConstraint("nucleus_id", "name", name="uq_services_nucleus_name"),
    )

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "nucleus_id": str(self.nucleus_id),
            "name": self.name,
            "description": self.description,
            "active": self.active,
        }
