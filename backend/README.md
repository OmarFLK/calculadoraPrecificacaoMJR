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
Para IA real no chat, configure `OPENAI_API_KEY`.
Para consultar demanda comercial, configure `MONDAY_API_KEY` com um token que tenha
acesso de leitura ao board desejado.

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
- `GET /pricing/suggestions?area=<area>`
- `POST /simulations`
- `GET /simulations`
- `GET /simulations/<id>`
- `POST /ai/analyze`
- `POST /ai/chat`
- `GET /analytics/overview`
- `GET /integrations/monday/boards/<board_id>`

Envie `Authorization: Bearer <token>` nos endpoints protegidos.

## Monday.com

O client usa a API GraphQL oficial, fixa a versão estável configurada em
`MONDAY_API_VERSION` e aplica timeout em todas as chamadas. Para testar:

```bash
curl -H "Authorization: Bearer <jwt-do-app>" \
  http://127.0.0.1:5000/integrations/monday/boards/<board_id>
```

Variáveis disponíveis:

- `MONDAY_API_KEY`: token pessoal ou de app, mantido apenas no backend
- `MONDAY_API_URL`: endpoint GraphQL, por padrão `https://api.monday.com/v2`
- `MONDAY_API_VERSION`: versão fixada da API, por padrão `2026-07`
- `MONDAY_REQUEST_TIMEOUT_SECONDS`: timeout da chamada HTTP
- `MONDAY_BOARD_ID`: board local de referência para testes manuais

Referência: [documentação oficial de autenticação](https://developer.monday.com/api-reference/docs/authentication)
e [consulta de boards](https://developer.monday.com/api-reference/reference/boards).

Com `MONDAY_API_KEY` e `MONDAY_BOARD_ID` preenchidos, rode o smoke test direto:

```bash
python scripts/check_monday_board.py
```

## Importação histórica

Arquivos CSV ou XLSX podem ser colocados em `data/historico/`. Dados reais nessa
pasta são ignorados pelo Git; apenas `exemplo.csv`, `schema.json` e o mapa editável
`aliases.json` são versionados.

Depois de aplicar as migrations e o seed, importe com:

```bash
python scripts/import_historical_projects.py ../data/historico/seu-arquivo.xlsx
```

O comando informa quantas linhas foram criadas, atualizadas ou ignoradas e o motivo
de cada rejeição. O campo externo `id` torna reimportações idempotentes. A sugestão
de preço usa a mediana de `charged_value` por área.

## Assistente OpenAI

`POST /ai/chat` usa a Responses API com `gpt-5.6-luna` por padrão. O backend
limita a saída com `OPENAI_MAX_OUTPUT_TOKENS`, envia apenas o resumo do projeto e
até seis mensagens recentes, desativa o armazenamento da resposta e registra os
tokens de entrada e saída somente no log da aplicação. O esforço de raciocínio
fica em `none` por padrão para reduzir latência e consumo nesse fluxo curto.

Referências oficiais: [Responses API](https://developers.openai.com/api/docs/guides/text)
e [catálogo de modelos](https://developers.openai.com/api/docs/models).

## Limitações atuais

- `/ai/chat` exige `OPENAI_API_KEY` para chamadas reais e retorna fallback amigável em caso de erro.
- `/ai/analyze` segue como análise mockada e registra log em `ai_analysis_logs`.
- Google Drive ainda salva apenas `drive_link`.
- O client do Monday está pronto, mas exige token e board reais para o smoke test externo.
- Não há roles/admin avançado.
