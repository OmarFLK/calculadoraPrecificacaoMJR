"""initial pricing ai schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    create_users()
    create_catalog_tables()
    create_historical_projects()
    create_project_files()
    create_pricing_simulations()
    create_ai_analysis_logs()
    create_pricing_rules()
    create_analytics_views()


def downgrade():
    drop_analytics_views()
    op.drop_table("pricing_rules")
    op.drop_table("ai_analysis_logs")
    op.drop_table("pricing_simulations")
    op.drop_table("project_files")
    op.drop_table("historical_projects")
    op.drop_table("services")
    op.drop_table("complexity_levels")
    op.drop_table("nuclei")
    op.drop_table("users")


def uuid_pk():
    return sa.Column(
        "id",
        postgresql.UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )


def timestamps(include_updated=False):
    columns = [sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now())]

    if include_updated:
        columns.append(sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))

    return columns


def create_users():
    op.create_table(
        "users",
        uuid_pk(),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(160), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        *timestamps(include_updated=True),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])


def create_catalog_tables():
    op.create_table(
        "nuclei",
        uuid_pk(),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.Text()),
        *timestamps(),
        sa.UniqueConstraint("name", name="uq_nuclei_name"),
    )
    op.create_table(
        "services",
        uuid_pk(),
        sa.Column("nucleus_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("nuclei.id"), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        *timestamps(),
        sa.UniqueConstraint("nucleus_id", "name", name="uq_services_nucleus_name"),
    )
    op.create_index("ix_services_nucleus_id", "services", ["nucleus_id"])
    op.create_table(
        "complexity_levels",
        uuid_pk(),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("multiplier", sa.Numeric(5, 2), nullable=False),
        sa.Column("description", sa.Text()),
        *timestamps(),
        sa.CheckConstraint("multiplier >= 0", name="ck_complexity_levels_multiplier_non_negative"),
        sa.UniqueConstraint("name", name="uq_complexity_levels_name"),
    )


def create_historical_projects():
    op.create_table(
        "historical_projects",
        uuid_pk(),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("nucleus_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("nuclei.id"), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("complexity_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("complexity_levels.id"), nullable=False),
        sa.Column("project_name", sa.String(180), nullable=False),
        sa.Column("client_name", sa.String(180)),
        sa.Column("context", sa.Text()),
        sa.Column("observations", sa.Text()),
        sa.Column("charged_value", sa.Numeric(12, 2)),
        sa.Column("reference_ticket", sa.Numeric(12, 2)),
        sa.Column("average_hour_value", sa.Numeric(10, 2)),
        sa.Column("desired_profit_margin", sa.Numeric(6, 2)),
        sa.Column("taxes_percentage", sa.Numeric(6, 2)),
        sa.Column("extra_costs", sa.Numeric(12, 2)),
        sa.Column("execution_time", sa.Numeric(8, 2)),
        sa.Column("execution_time_unit", sa.String(20), nullable=False, server_default="semanas"),
        sa.Column("total_worked_hours", sa.Numeric(10, 2)),
        sa.Column("consultants_count", sa.Integer()),
        sa.Column("weekly_hours_average", sa.Numeric(8, 2)),
        *timestamps(include_updated=True),
        sa.CheckConstraint("execution_time_unit IN ('dias', 'semanas', 'meses')", name="ck_historical_projects_time_unit"),
        sa.CheckConstraint("charged_value IS NULL OR charged_value >= 0", name="ck_historical_projects_charged_value_non_negative"),
        sa.CheckConstraint("reference_ticket IS NULL OR reference_ticket >= 0", name="ck_historical_projects_reference_ticket_non_negative"),
        sa.CheckConstraint("average_hour_value IS NULL OR average_hour_value >= 0", name="ck_historical_projects_average_hour_value_non_negative"),
        sa.CheckConstraint("desired_profit_margin IS NULL OR desired_profit_margin >= 0", name="ck_historical_projects_margin_non_negative"),
        sa.CheckConstraint("taxes_percentage IS NULL OR taxes_percentage >= 0", name="ck_historical_projects_taxes_non_negative"),
        sa.CheckConstraint("extra_costs IS NULL OR extra_costs >= 0", name="ck_historical_projects_extra_costs_non_negative"),
        sa.CheckConstraint("execution_time IS NULL OR execution_time >= 0", name="ck_historical_projects_execution_time_non_negative"),
        sa.CheckConstraint("total_worked_hours IS NULL OR total_worked_hours >= 0", name="ck_historical_projects_hours_non_negative"),
        sa.CheckConstraint("consultants_count IS NULL OR consultants_count >= 0", name="ck_historical_projects_consultants_non_negative"),
        sa.CheckConstraint("weekly_hours_average IS NULL OR weekly_hours_average >= 0", name="ck_historical_projects_weekly_hours_non_negative"),
    )
    op.create_index("ix_historical_projects_nucleus_id", "historical_projects", ["nucleus_id"])
    op.create_index("ix_historical_projects_service_id", "historical_projects", ["service_id"])
    op.create_index("ix_historical_projects_complexity_id", "historical_projects", ["complexity_id"])
    op.create_index("ix_historical_projects_charged_value", "historical_projects", ["charged_value"])
    op.create_index("ix_historical_projects_created_at", "historical_projects", ["created_at"])
    op.create_index("ix_historical_projects_created_by", "historical_projects", ["created_by"])


def create_project_files():
    op.create_table(
        "project_files",
        uuid_pk(),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("historical_projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_name", sa.String(180)),
        sa.Column("file_type", sa.String(80)),
        sa.Column("drive_url", sa.Text(), nullable=False),
        sa.Column("description", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_project_files_project_id", "project_files", ["project_id"])


def create_pricing_simulations():
    op.create_table(
        "pricing_simulations",
        uuid_pk(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("nucleus_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("nuclei.id"), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("services.id"), nullable=False),
        sa.Column("complexity_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("complexity_levels.id"), nullable=False),
        sa.Column("project_name", sa.String(180)),
        sa.Column("client_name", sa.String(180)),
        sa.Column("context", sa.Text()),
        sa.Column("total_worked_hours", sa.Numeric(10, 2), nullable=False),
        sa.Column("consultants_count", sa.Integer()),
        sa.Column("weekly_hours_average", sa.Numeric(8, 2)),
        sa.Column("average_hour_value", sa.Numeric(10, 2), nullable=False),
        sa.Column("desired_profit_margin", sa.Numeric(6, 2), nullable=False),
        sa.Column("taxes_percentage", sa.Numeric(6, 2), nullable=False, server_default="0"),
        sa.Column("extra_costs", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("base_cost", sa.Numeric(12, 2)),
        sa.Column("value_with_margin", sa.Numeric(12, 2)),
        sa.Column("value_with_taxes", sa.Numeric(12, 2)),
        sa.Column("final_price", sa.Numeric(12, 2)),
        sa.Column("minimum_price", sa.Numeric(12, 2)),
        sa.Column("ideal_price", sa.Numeric(12, 2)),
        sa.Column("premium_price", sa.Numeric(12, 2)),
        *timestamps(),
        sa.CheckConstraint("total_worked_hours >= 0", name="ck_pricing_simulations_hours_non_negative"),
        sa.CheckConstraint("consultants_count IS NULL OR consultants_count >= 0", name="ck_pricing_simulations_consultants_non_negative"),
        sa.CheckConstraint("weekly_hours_average IS NULL OR weekly_hours_average >= 0", name="ck_pricing_simulations_weekly_hours_non_negative"),
        sa.CheckConstraint("average_hour_value >= 0", name="ck_pricing_simulations_average_hour_value_non_negative"),
        sa.CheckConstraint("desired_profit_margin >= 0", name="ck_pricing_simulations_margin_non_negative"),
        sa.CheckConstraint("taxes_percentage >= 0", name="ck_pricing_simulations_taxes_non_negative"),
        sa.CheckConstraint("extra_costs >= 0", name="ck_pricing_simulations_extra_costs_non_negative"),
    )
    op.create_index("ix_pricing_simulations_user_id", "pricing_simulations", ["user_id"])
    op.create_index("ix_pricing_simulations_nucleus_id", "pricing_simulations", ["nucleus_id"])
    op.create_index("ix_pricing_simulations_service_id", "pricing_simulations", ["service_id"])
    op.create_index("ix_pricing_simulations_created_at", "pricing_simulations", ["created_at"])
    op.create_index("ix_pricing_simulations_final_price", "pricing_simulations", ["final_price"])


def create_ai_analysis_logs():
    op.create_table(
        "ai_analysis_logs",
        uuid_pk(),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("simulation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("pricing_simulations.id")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("historical_projects.id")),
        sa.Column("prompt", sa.Text()),
        sa.Column("response", sa.Text()),
        sa.Column("suggested_complexity", sa.String(80)),
        sa.Column("estimated_risk", sa.String(80)),
        sa.Column("model_used", sa.String(120)),
        sa.Column("input_tokens", sa.Integer()),
        sa.Column("output_tokens", sa.Integer()),
        *timestamps(),
        sa.CheckConstraint("input_tokens IS NULL OR input_tokens >= 0", name="ck_ai_analysis_logs_input_tokens_non_negative"),
        sa.CheckConstraint("output_tokens IS NULL OR output_tokens >= 0", name="ck_ai_analysis_logs_output_tokens_non_negative"),
    )
    op.create_index("ix_ai_analysis_logs_user_id", "ai_analysis_logs", ["user_id"])
    op.create_index("ix_ai_analysis_logs_simulation_id", "ai_analysis_logs", ["simulation_id"])
    op.create_index("ix_ai_analysis_logs_project_id", "ai_analysis_logs", ["project_id"])


def create_pricing_rules():
    op.create_table(
        "pricing_rules",
        uuid_pk(),
        sa.Column("rule_name", sa.String(120), nullable=False),
        sa.Column("rule_key", sa.String(120), nullable=False),
        sa.Column("rule_value", sa.Numeric(12, 4)),
        sa.Column("description", sa.Text()),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        *timestamps(include_updated=True),
        sa.CheckConstraint("rule_value IS NULL OR rule_value >= 0", name="ck_pricing_rules_rule_value_non_negative"),
        sa.UniqueConstraint("rule_name", name="uq_pricing_rules_rule_name"),
        sa.UniqueConstraint("rule_key", name="uq_pricing_rules_rule_key"),
    )


def create_analytics_views():
    op.execute("""
        CREATE VIEW view_ticket_by_nucleus AS
        SELECT
            n.name AS nucleo,
            COUNT(hp.id) AS quantidade_projetos,
            AVG(hp.charged_value) AS ticket_medio,
            MAX(hp.charged_value) AS maior_ticket,
            MIN(hp.charged_value) AS menor_ticket
        FROM nuclei n
        LEFT JOIN historical_projects hp ON hp.nucleus_id = n.id
        GROUP BY n.name
    """)
    op.execute("""
        CREATE VIEW view_ticket_by_service AS
        SELECT
            n.name AS nucleo,
            s.name AS servico,
            COUNT(hp.id) AS quantidade_projetos,
            AVG(hp.charged_value) AS ticket_medio,
            AVG(hp.execution_time) AS tempo_medio,
            AVG(hp.total_worked_hours) AS horas_medias
        FROM services s
        JOIN nuclei n ON n.id = s.nucleus_id
        LEFT JOIN historical_projects hp ON hp.service_id = s.id
        GROUP BY n.name, s.name
    """)
    op.execute("""
        CREATE VIEW view_complexity_distribution AS
        SELECT
            cl.name AS complexidade,
            COUNT(hp.id) AS quantidade,
            AVG(hp.charged_value) AS ticket_medio
        FROM complexity_levels cl
        LEFT JOIN historical_projects hp ON hp.complexity_id = cl.id
        GROUP BY cl.name
    """)


def drop_analytics_views():
    op.execute("DROP VIEW IF EXISTS view_complexity_distribution")
    op.execute("DROP VIEW IF EXISTS view_ticket_by_service")
    op.execute("DROP VIEW IF EXISTS view_ticket_by_nucleus")
