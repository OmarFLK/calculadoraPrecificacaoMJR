# Notes

- 2026-07-16: o smoke test da OpenAI alcançou `POST /v1/responses`, mas a conta respondeu HTTP 429. Revisar cota, faturamento e limites do projeto antes da validação paga ponta a ponta.
- O smoke test real do Monday depende de preencher `MONDAY_API_KEY` e `MONDAY_BOARD_ID` no `backend/.env` local.
- A migration `0002_historical_import` foi validada pelo Alembic e por SQLite em memória, mas ainda precisa ser aplicada ao PostgreSQL do ambiente.
- `npm ci` reportou 3 vulnerabilidades no lockfile existente (2 baixas e 1 alta); revisar com `npm audit` antes de produção, sem aplicar correções automáticas às cegas.
