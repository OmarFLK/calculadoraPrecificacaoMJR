"""add historical import fields

Revision ID: 0002_historical_import
Revises: 0001_initial_schema
Create Date: 2026-07-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_historical_import"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        "historical_projects",
        "service_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.alter_column(
        "historical_projects",
        "complexity_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=True,
    )
    op.add_column("historical_projects", sa.Column("source_id", sa.String(180)))
    op.add_column("historical_projects", sa.Column("source_file", sa.String(255)))
    op.add_column("historical_projects", sa.Column("project_date", sa.Date()))
    op.add_column("historical_projects", sa.Column("result", sa.String(120)))
    op.add_column(
        "historical_projects",
        sa.Column(
            "costs_json",
            sa.JSON(),
            nullable=False,
            server_default=sa.text("'{}'::json"),
        ),
    )
    op.create_index(
        "ix_historical_projects_project_date",
        "historical_projects",
        ["project_date"],
    )
    op.create_unique_constraint(
        "uq_historical_projects_creator_source_id",
        "historical_projects",
        ["created_by", "source_id"],
    )


def downgrade():
    op.drop_constraint(
        "uq_historical_projects_creator_source_id",
        "historical_projects",
        type_="unique",
    )
    op.drop_index(
        "ix_historical_projects_project_date",
        table_name="historical_projects",
    )
    op.drop_column("historical_projects", "costs_json")
    op.drop_column("historical_projects", "result")
    op.drop_column("historical_projects", "project_date")
    op.drop_column("historical_projects", "source_file")
    op.drop_column("historical_projects", "source_id")
    op.alter_column(
        "historical_projects",
        "complexity_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
    op.alter_column(
        "historical_projects",
        "service_id",
        existing_type=postgresql.UUID(as_uuid=True),
        nullable=False,
    )
