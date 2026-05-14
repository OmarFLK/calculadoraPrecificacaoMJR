from extensions import db
from models.base import TimestampMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.helpers import decimal_to_float


class PricingRule(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    __tablename__ = "pricing_rules"

    rule_name = db.Column(db.String(120), nullable=False, unique=True)
    rule_key = db.Column(db.String(120), nullable=False, unique=True)
    rule_value = db.Column(db.Numeric(12, 4))
    description = db.Column(db.Text)
    active = db.Column(db.Boolean, nullable=False, default=True)

    __table_args__ = (
        db.CheckConstraint("rule_value IS NULL OR rule_value >= 0", name="ck_pricing_rules_rule_value_non_negative"),
    )

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "rule_name": self.rule_name,
            "rule_key": self.rule_key,
            "rule_value": decimal_to_float(self.rule_value),
            "description": self.description,
            "active": self.active,
        }
