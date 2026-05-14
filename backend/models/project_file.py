from extensions import db
from models.base import CreatedAtMixin, UUIDPrimaryKeyMixin, serialize_base
from utils.db_types import GUID


class ProjectFile(UUIDPrimaryKeyMixin, CreatedAtMixin, db.Model):
    __tablename__ = "project_files"

    project_id = db.Column(
        GUID(),
        db.ForeignKey("historical_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    file_name = db.Column(db.String(180))
    file_type = db.Column(db.String(80))
    drive_url = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)

    project = db.relationship("HistoricalProject", back_populates="files")

    def to_dict(self) -> dict:
        return {
            **serialize_base(self),
            "project_id": str(self.project_id),
            "file_name": self.file_name,
            "file_type": self.file_type,
            "drive_url": self.drive_url,
            "description": self.description,
        }
