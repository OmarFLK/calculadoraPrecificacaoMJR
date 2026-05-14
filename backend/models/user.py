from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models.base import TimestampMixin, UUIDPrimaryKeyMixin, serialize_base


class User(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    __tablename__ = "users"

    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.Text, nullable=False)

    historical_projects = db.relationship("HistoricalProject", back_populates="creator")
    pricing_simulations = db.relationship("PricingSimulation", back_populates="user")
    ai_analysis_logs = db.relationship("AiAnalysisLog", back_populates="user")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "name": self.name,
            "email": self.email,
        }
