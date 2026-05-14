import uuid

from extensions import db
from utils.db_types import GUID
from utils.helpers import serialize_datetime, utc_now


class UUIDPrimaryKeyMixin:
    id = db.Column(GUID(), primary_key=True, default=uuid.uuid4)


class CreatedAtMixin:
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utc_now)


class TimestampMixin(CreatedAtMixin):
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=utc_now,
        onupdate=utc_now,
    )


def serialize_base(model) -> dict:
    result = {"id": str(model.id)}

    if hasattr(model, "created_at"):
        result["created_at"] = serialize_datetime(model.created_at)

    if hasattr(model, "updated_at"):
        result["updated_at"] = serialize_datetime(model.updated_at)

    return result
