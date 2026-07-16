# Maua Jr Pricing AI:

> Sistema full-stack de precificacao de projetos para a Maua Junior, desenvolvido com foco em MVP funcional, organizacao interna, escalabilidade e apoio inteligente a decisao comercial.

![Python](https://img.shields.io/badge/PYTHON-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/FLASK-BACKEND-000000?style=for-the-badge&logo=flask&logoColor=white)
![React](https://img.shields.io/badge/REACT-FRONTEND-61DAFB?style=for-the-badge&logo=react&logoColor=111111)
![TypeScript](https://img.shields.io/badge/TYPESCRIPT-UI-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/VITE-BUILD-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/POSTGRESQL-DATABASE-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLALCHEMY-ORM-BB0000?style=for-the-badge)
![OpenRouter](https://img.shields.io/badge/OPENROUTER-AI-0F172A?style=for-the-badge)

---

## Sobre o Projeto:

O **Maua Jr Pricing AI** e uma aplicacao web full-stack criada para apoiar a precificacao de projetos internos da Maua Junior.

A plataforma permite cadastrar projetos historicos, simular precos, analisar custos, registrar contexto comercial e conversar com um assistente de IA para apoiar decisoes de escopo, complexidade, riscos e faixa de preco.

O sistema foi projetado como um MVP evolutivo, com foco em:

- interface premium e profissional para uso interno
- calculadora de precificacao baseada em regras claras
- historico de projetos e simulacoes
- backend modular em Flask
- banco PostgreSQL estruturado para analytics
- preparacao para Google Drive, IA e evolucoes futuras
- seguranca basica com JWT e variaveis de ambiente

---

## Objetivo:

Desenvolver uma base funcional e escalavel para centralizar a precificacao de projetos da Maua Junior, demonstrando dominio de:

- Frontend moderno
- Backend organizado
- Banco de dados relacional
- Regras de negocio centralizadas
- Integracao full-stack
- IA aplicada ao contexto comercial
- Deploy e configuracao por ambiente

---

## Arquitetura do Sistema:

```txt
Usuario interno
    |
Frontend React + Vite + TypeScript
    |
API REST Flask
    |
Services / Business Rules
    |
SQLAlchemy ORM
    |
PostgreSQL Database

Assistente IA
    |
Frontend Chat
    |
Backend /ai/chat
    |
OpenRouter API

Demanda comercial
    |
Backend /integrations/monday/boards/:id
    |
Monday.com GraphQL API
```

---

## Tecnologias Utilizadas:

### Frontend:

- React
- TypeScript
- Vite
- CSS global organizado
- Lucide React
- Componentizacao por responsabilidade

### Backend:

- Python
- Flask
- Flask-CORS
- Flask-SQLAlchemy
- Flask-Migrate
- SQLAlchemy
- Alembic
- PyJWT
- python-dotenv
- requests

### Banco de Dados:

- PostgreSQL
- UUID como chave primaria
- NUMERIC para valores monetarios
- migrations versionadas com Alembic
- seed inicial para nucleos, servicos, complexidades e regras

### Inteligencia Artificial:

- OpenRouter API
- Endpoint backend `/ai/chat`
- Chave protegida via `.env`
- Prompt de sistema para comportamento como Assistente IA da Maua Junior
- fallback amigavel em caso de erro

---

## Funcionalidades:

### Autenticacao:

- login simples no frontend para acesso ao MVP
- backend preparado com registro, login e rota `/auth/me`
- JWT para rotas protegidas
- hash seguro de senha

### Calculadora de Precificacao:

- selecao de nucleo
- selecao dinamica de servico
- nome do projeto
- valor cobrado
- ticket medio de referencia
- tempo de execucao
- unidade de tempo
- horas totais trabalhadas
- quantidade de consultores
- media de horas por consultor por semana
- valor medio da hora
- margem desejada
- impostos
- custos extras
- complexidade
- multiplicador automatico
- link do Google Drive
- contexto do projeto em modal

### Resultado Simulado:

O calculo considera:

```txt
custo_base = horas_totais * valor_hora
valor_com_margem = custo_base * (1 + margem / 100)
valor_com_impostos = valor_com_margem * (1 + impostos / 100)
preco_final = (valor_com_impostos * multiplicador_complexidade) + custos_extras
```

### Historico:

- card recolhido para evitar poluicao visual
- resumo do total de projetos
- projeto ativo
- valor historico acumulado
- listagem expansivel
- selecao e remocao de itens
- importacao normalizada de CSV/XLSX com aliases editaveis
- sugestao por mediana do preco praticado em cada area

### Dashboard e Analytics:

- resumo financeiro
- cards de indicadores
- graficos de barras
- grafico de distribuicao por donut
- filtros analiticos por nucleo, complexidade, ticket, consultores, prazo e margem

### Assistente IA:

- chat lateral integrado ao backend
- historico visual da conversa
- scroll interno para mensagens longas
- resposta via OpenRouter
- resposta sanitizada para evitar Markdown/HTML quebrando a interface
- comportamento orientado ao contexto da Maua Junior

---

## Nucleos e Servicos:

```txt
Tecnologia
  - Implementacao de Inteligencia Artificial
  - Ciencia de Dados
  - Desenvolvimento de Sistemas
  - Desenvolvimento de Websites
  - Desenvolvimento de Aplicativos

Gestao Empresarial
  - Analise Financeira
  - Plano de Negocio
  - Pesquisa de Mercado

Design
  - Identidade Visual
  - Design de Produtos

Gestao de Processos
  - Cronoanalise
  - Desenvolvimento de POPs
  - Mapeamento de Processos
  - Otimizacao de Processos
  - Padronizacao de Processos

Quimica e Alimentos
  - Pesquisa de Rota Produtiva
  - Estudo e Desenvolvimento de Cosmeticos
  - Formulacao de Alimentos
  - Neutralizacao de Carbono
  - Rotulagem de Produtos
  - Estudo de Embalagem
```

---

## Organizacao do Codigo:

```txt
backend/
  app.py                    aplicacao Flask e blueprints
  config.py                 variaveis de ambiente e configuracoes
  extensions.py             SQLAlchemy, CORS e migrations
  requirements.txt          dependencias Python
  .env.example              exemplo de configuracao local

  routes/                   endpoints REST
  models/                   models SQLAlchemy
  services/                 regras de negocio e integracoes
  utils/                    auth, validadores e helpers
  migrations/               Alembic / Flask-Migrate
  scripts/                  seed inicial do banco

frontend/
  index.html
  package.json
  vite.config.ts

  src/
    App.tsx                 composicao principal
    main.tsx                entrada React
    components/             componentes da interface
    data/                   catalogo mockado de servicos
    logic/                  calculos de precificacao
    styles/                 CSS global
    types/                  tipos TypeScript

skills/
  arquivos de contexto e padroes do projeto
```

---

## Setup Local:

### Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

API local:

```txt
http://127.0.0.1:5000
```

### Frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend local:

```txt
http://127.0.0.1:5173
```

Caso a porta `5173` esteja ocupada, o Vite pode abrir em `5174`.

---

## Variaveis de Ambiente:

O arquivo real `backend/.env` nao deve ser versionado.

Exemplo:

```env
FLASK_ENV=development
FLASK_DEBUG=true
SECRET_KEY=change-this-secret
JWT_SECRET_KEY=change-this-jwt-secret
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/maua_pricing_ai
FRONTEND_ORIGIN=http://127.0.0.1:5173

MONDAY_API_KEY=
MONDAY_API_URL=https://api.monday.com/v2
MONDAY_API_VERSION=2026-04
MONDAY_REQUEST_TIMEOUT_SECONDS=10
MONDAY_BOARD_ID=

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
OPENROUTER_SITE_URL=http://127.0.0.1:5173
OPENROUTER_APP_TITLE=Maua Jr Pricing AI
```

---

## Banco de Dados:

Criar e migrar estrutura:

```bash
cd backend
flask --app app db upgrade
```

Importar histórico de exemplo:

```bash
cd backend
python scripts/import_historical_projects.py ../data/historico/exemplo.csv
```

Popular dados iniciais:

```bash
python scripts/seed_database.py
```

Tabelas principais:

- users
- nuclei
- services
- complexity_levels
- historical_projects
- project_files
- pricing_simulations
- ai_analysis_logs
- pricing_rules

Views para analytics:

- view_ticket_by_nucleus
- view_ticket_by_service
- view_complexity_distribution

---

## Deploy:

O projeto foi estruturado para deploy separado:

- Frontend: Vercel
- Backend: Render, Railway ou similar
- Banco de dados: PostgreSQL gerenciado
- IA: OpenRouter configurado no ambiente do backend

No deploy, configure as variaveis de ambiente no painel da plataforma.
Nunca suba arquivos `.env` reais para o repositorio.

---

## Validacao:

Comandos usados durante o desenvolvimento:

```bash
cd frontend
npm run build
```

```bash
cd backend
python -m compileall .
```

Tambem foram testados:

- carregamento das variaveis OpenRouter
- endpoint `/health`
- endpoint `/ai/chat`
- CORS local para portas `5173` e `5174`
- retorno da IA via OpenRouter

---

## Seguranca:

- chaves de API ficam apenas no backend
- `.env` real esta ignorado pelo Git
- nenhuma credencial real deve ser exposta no frontend
- JWT preparado para autenticacao backend
- senhas armazenadas com hash
- arquivos pesados nao sao salvos no banco
- Google Drive e usado apenas como link externo no MVP

---

## Status do Projeto:

MVP funcional com:

- frontend React finalizado para demonstracao
- backend Flask estruturado
- modelagem PostgreSQL pronta
- migrations e seeds iniciais
- IA via OpenRouter integrada
- dashboard e historico funcionais
- base preparada para evolucao com banco real, Drive e analytics avancado
