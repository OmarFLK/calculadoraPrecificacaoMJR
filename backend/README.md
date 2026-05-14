# Mauá Jr Pricing AI Backend

Backend Flask para autenticação, modelagem PostgreSQL, projetos históricos, simulações de precificação, analytics e preparação para IA.

## Stack

- Python
- Flask
- Flask-CORS
- SQLAlchemy / Flask-SQLAlchemy
- PostgreSQL via psycopg2
- Flask-Migrate / Alembic
- PyJWT
- python-dotenv
- requests

## Setup local

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edite `DATABASE_URL` no `.env` para apontar para seu PostgreSQL local.
Para IA real no chat, configure `OPENROUTER_API_KEY`.

## Banco e migrations

```bash
flask --app app db upgrade
```

A primeira migration manual já está em `migrations/versions/0001_initial_pricing_ai_schema.py`.

Ela cria:

- `users`
- `nuclei`
- `services`
- `complexity_levels`
- `historical_projects`
- `project_files`
- `pricing_simulations`
- `ai_analysis_logs`
- `pricing_rules`
- views `view_ticket_by_nucleus`, `view_ticket_by_service`, `view_complexity_distribution`

## Popular dados iniciais

```bash
python scripts/seed_database.py
```

O seed cria núcleos, serviços, níveis de complexidade, regras básicas e o usuário teste:

```text
teste@mauajr.com
123456
```

## Rodar API

```bash
flask --app app run --debug
```

Healthcheck:

```text
GET /health
```

## Endpoints principais

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /projects`
- `GET /projects/<id>`
- `POST /projects`
- `PUT /projects/<id>`
- `DELETE /projects/<id>`
- `POST /pricing/calculate`
- `POST /simulations`
- `GET /simulations`
- `GET /simulations/<id>`
- `POST /ai/analyze`
- `POST /ai/chat`
- `GET /analytics/overview`

Envie `Authorization: Bearer <token>` nos endpoints protegidos.

## Limitações atuais

- `/ai/chat` usa OpenRouter quando `OPENROUTER_API_KEY` estiver configurada e retorna fallback amigável em caso de erro.
- `/ai/analyze` segue como análise mockada e registra log em `ai_analysis_logs`.
- Google Drive ainda salva apenas `drive_link`.
- Não há roles/admin avançado.
