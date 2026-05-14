from extensions import db
from models.base import CreatedAtMixin, UUIDPrimaryKeyMixin, serialize_base


class Nucleus(UUIDPrimaryKeyMixin, CreatedAtMixin, db.Model):
    __tablename__ = "nuclei"

    name = db.Column(db.String(120), nullable=False, unique=True)
    description = db.Column(db.Text)

    services = db.relationship("Service", back_populates="nucleus")
    historical_projects = db.relationship("HistoricalProject", back_populates="nucleus")
    pricing_simulations = db.relationship("PricingSimulation", back_populates="nucleus")

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "name": self.name,
            "description": self.description,
        }
