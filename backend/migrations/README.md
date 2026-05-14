Migrations are managed by Flask-Migrate/Alembic.

Initialize locally after configuring PostgreSQL:

```bash
flask --app app db init
flask --app app db migrate -m "create pricing ai schema"
flask --app app db upgrade
```

The generated Alembic files should stay inside this folder.
