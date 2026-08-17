# Configuração das APIs — OpenAI e monday.com

Este projeto precisa de duas integrações externas para ficar completo:

- OpenAI Responses API para o Assistente IA de Precificação;
- monday.com GraphQL API para o sinal operacional de demanda.

As duas chaves ficam exclusivamente no backend. O frontend chama apenas a API Flask do próprio projeto.

## Fluxo usado pelo projeto

```text
Frontend React
  ├─ POST /ai/chat
  │    └─ Backend → POST https://api.openai.com/v1/responses
  └─ GET /integrations/monday/pricing-context
       └─ Backend → POST https://api.monday.com/v2 (GraphQL)
```

## 1. Preparação local

Na raiz do repositório:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

O arquivo `backend/.env` real é ignorado pelo Git. Nunca coloque tokens no código, no frontend ou em commits.

## 2. OpenAI

### O que é necessário

Para a funcionalidade atual, é necessária somente a **Responses API** (`POST /v1/responses`). Não são necessárias as APIs de Assistants, Realtime, Áudio, Imagens, Embeddings ou Files.

O backend já envia:

- `model`, `instructions` e `input`;
- `max_output_tokens` para limitar consumo;
- `store: false` para não manter a resposta como estado da API;
- `reasoning.effort: none` para baixa latência nesse fluxo curto.

### Passo a passo

1. Entre em [OpenAI Platform](https://platform.openai.com/) e selecione/crie o projeto da Mauá Jr.
2. Configure faturamento, orçamento mensal e alertas de uso para o projeto.
3. Crie uma chave de API pertencente ao projeto.
4. Preencha somente no `backend/.env`:

```env
OPENAI_API_KEY=cole_a_chave_aqui
OPENAI_MODEL=gpt-5.6-luna
OPENAI_RESPONSES_URL=https://api.openai.com/v1/responses
OPENAI_MAX_OUTPUT_TOKENS=320
OPENAI_REASONING_EFFORT=none
OPENAI_REQUEST_TIMEOUT_SECONDS=30
```

5. Instale e inicie o backend:

```powershell
Set-Location backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
flask --app app run --debug
```

6. Inicie o frontend em outro terminal e envie uma pergunta no card **OpenAI — Assistente IA de Precificação**.

### Validação

Com o backend em execução:

```powershell
$body = @{
  message = "Quais riscos devo revisar antes de fechar este preço?"
  projectContext = "Teste de integração"
  pricingData = @{ area = "Tecnologia"; suggestedPrice = 10000 }
} | ConvertTo-Json -Depth 4

Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:5000/ai/chat `
  -ContentType "application/json" `
  -Body $body
```

O retorno esperado contém `success: true` e `answer`. Erro `503` com menção a `OPENAI_API_KEY` significa que a chave não foi carregada. Erro `502` indica falha da chamada externa, modelo sem acesso, limite, saldo ou rede.

Referências oficiais: [quickstart](https://developers.openai.com/api/docs/quickstart), [Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses) e [GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna).

## 3. monday.com

### O que é necessário agora

Para o sinal operacional atual, o backend faz apenas leitura:

- autenticação por token no header `Authorization`;
- consulta GraphQL de um board pelo ID;
- leitura de colunas;
- leitura paginada de itens com `items_page` e `next_items_page`;
- escopo mínimo `boards:read` quando for usado um token de app.

Não são necessários agora `boards:write`, `updates:write`, criação de itens ou webhooks. Esses acessos só devem ser adicionados se o produto futuramente escrever preço/status no monday.com ou receber atualizações em tempo real.

### Estrutura mínima do board

O board comercial deve ter:

- uma coluna de status, preferencialmente chamada `Status`, `Situação`, `Fase` ou `Etapa`;
- uma coluna de área, preferencialmente chamada `Área`, `Núcleo` ou `Serviço`;
- labels de status ativo coerentes com `MONDAY_ACTIVE_STATUS_LABELS`.

É mais seguro informar os IDs reais das colunas em produção, porque títulos podem ser renomeados.

### Passo a passo para o MVP interno

1. No monday.com, abra a foto do perfil → **Developers** → **API token** → **Show**.
2. Garanta que esse usuário consiga visualizar o board comercial; o token pessoal herda as permissões do usuário.
3. Abra o board e copie o número presente na URL como `MONDAY_BOARD_ID`.
4. Ative o Developer Mode ou use o API Playground para confirmar os IDs das colunas de status e área.
5. Preencha no `backend/.env`:

```env
MONDAY_API_KEY=cole_o_token_aqui
MONDAY_API_URL=https://api.monday.com/v2
MONDAY_API_VERSION=2026-07
MONDAY_REQUEST_TIMEOUT_SECONDS=10
MONDAY_BOARD_ID=1234567890
MONDAY_STATUS_COLUMN_ID=status
MONDAY_AREA_COLUMN_ID=area
MONDAY_ACTIVE_STATUS_LABELS=Novo,Em negociação,Proposta enviada,Em andamento
MONDAY_DEMAND_MEDIUM_THRESHOLD=4
MONDAY_DEMAND_HIGH_THRESHOLD=8
MONDAY_DEMAND_MEDIUM_ADJUSTMENT=5
MONDAY_DEMAND_HIGH_ADJUSTMENT=10
MONDAY_CACHE_TTL_SECONDS=300
```

6. Valide a conexão direta a partir da pasta `backend`:

```powershell
python scripts/check_monday_board.py
```

O retorno esperado é `Monday board OK`, seguido do ID, nome e quantidade de itens carregados.

7. Com o backend rodando, valide o agregado usado pelo frontend:

```powershell
Invoke-RestMethod "http://127.0.0.1:5000/integrations/monday/pricing-context?area=Tecnologia"
```

Enquanto token e board não forem configurados, o card permanece como placeholder de integração futura e a simulação principal continua funcionando.

Referências oficiais: [autenticação](https://developer.monday.com/api-reference/docs/authentication), [boards](https://developer.monday.com/api-reference/reference/boards), [items_page](https://developer.monday.com/api-reference/reference/items-page) e [versionamento](https://developer.monday.com/api-reference/docs/api-versioning).

### Evolução futura recomendada

Para uso por vários usuários ou instalação em outras contas monday.com:

1. criar um app privado no monday Developer Center;
2. usar OAuth em vez de um token pessoal compartilhado;
3. começar somente com `boards:read`;
4. adicionar `boards:write`/`updates:write` apenas quando existir escrita;
5. adicionar webhooks apenas quando o produto precisar sincronização em tempo real, incluindo validação do `challenge` e os escopos mínimos de webhook.

## 4. Frontend e deploy

O frontend precisa apenas conhecer a URL pública do backend:

```env
VITE_API_URL=http://127.0.0.1:5000
```

Em produção, troque pelo domínio HTTPS da API Flask. Configure `FRONTEND_URL` e `FRONTEND_ORIGIN` no backend com o domínio do frontend para que o CORS permita as requisições.

## 5. Checklist final

- [ ] `backend/.env` existe e não está versionado;
- [ ] `OPENAI_API_KEY` pertence ao projeto correto e tem orçamento configurado;
- [ ] `POST /ai/chat` retorna `success: true`;
- [ ] token monday.com consegue ler o board;
- [ ] IDs do board, coluna de status e coluna de área foram confirmados;
- [ ] `python scripts/check_monday_board.py` conclui com sucesso;
- [ ] `GET /integrations/monday/pricing-context` retorna `configured: true`;
- [ ] `VITE_API_URL`, `FRONTEND_URL` e `FRONTEND_ORIGIN` apontam para os domínios corretos;
- [ ] nenhuma chave está no frontend, no Git ou em logs.
