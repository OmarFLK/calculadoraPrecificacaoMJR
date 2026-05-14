from logging.config import fileConfig

from flask import current_app

from extensions import db

config = current_app.extensions["migrate"].migrate.get_config()

fileConfig(config.config_file_name)
target_metadata = db.metadata


def get_engine():
    return current_app.extensions["migrate"].db.get_engine()


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = get_engine()

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


from alembic import context

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
