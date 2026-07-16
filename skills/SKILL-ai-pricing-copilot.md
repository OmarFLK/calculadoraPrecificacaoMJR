---
name: ai-pricing-copilot
description: Use esta skill ao trabalhar em qualquer integração externa da calculadora — Monday.com, ingestão de dados históricos de projetos, ou o chat de IA embutido. Cobre padrões de .env, formato de dados históricos e controle de custo de chamadas de API.
---

# AI Pricing Copilot — Integrações Externas

## Filosofia

Três fontes de inteligência alimentam a sugestão de preço, nessa ordem de
confiabilidade:
1. **Histórico interno** (dados reais de projetos passados) — fonte primária.
2. **Monday.com** (demanda atual/board em andamento) — ajusta o histórico
   pra cima ou pra baixo conforme demanda.
3. **Chat de IA** — só explica/discute a sugestão com o usuário, nunca é a
   fonte do número final sozinho.

Nunca deixe o chat de IA "inventar" um preço sem se basear nos dados 1 e 2.

## `.env` — convenção

```
MONDAY_API_KEY=
OPENAI_API_KEY=
```

- Nunca commitar `.env` real — só `.env.example` com as chaves vazias.
- Validar na inicialização do app se as chaves existem; se não existirem,
  as features dependentes (sugestão via Monday, chat) devem degradar
  graciosamente (esconder/desabilitar o recurso), nunca quebrar o app.

## Ingestão de dados históricos

Formato interno normalizado (independente de vir de CSV/XLSX do Drive):

```ts
type ProjetoHistorico = {
  id: string;
  area: string;              // bate com AreaProjeto.id
  custos: Record<string, number>; // id do campo -> valor preenchido
  precoFinalPraticado: number;
  data: string;               // ISO
  observacoes?: string;
};
```

Regras do importador:
- Nunca falhar silenciosamente numa linha malformada — coletar erros de
  parsing e reportar no final ("N linhas importadas, M ignoradas, motivo X").
- Normalizar nomes de campo do arquivo de origem para os `id`s do schema de
  custos (Etapa 1) — manter um mapa de aliases editável, já que a planilha
  do Drive provavelmente não usa os mesmos nomes internos.

## Cálculo de sugestão (fundação, não ML)

Para cada área, ao abrir um novo projeto:
1. Filtrar histórico pela mesma área.
2. Calcular mediana do `precoFinalPraticado` (mediana > média, é mais
   resistente a outliers de projeto atípico).
3. Se a integração Monday indicar demanda alta no board correspondente,
   aplicar um ajuste percentual simples (ex: +X%) — documentado e
   configurável, nunca mágico/escondido do usuário.

## Chat de IA — controle de custo

- Uma única função/serviço central faz a chamada à API da OpenAI — nunca
  espalhar `fetch` pra API em múltiplos componentes.
- Sempre passar contexto resumido (área + custos preenchidos + sugestão de
  preço), nunca o histórico inteiro — isso infla tokens de entrada à toa.
- Definir um teto de tokens de saída por resposta (a resposta é pra ajudar a
  decidir preço, não pra escrever um ensaio).
- Logar (localmente, não expor ao usuário final) tokens usados por request,
  pra você acompanhar custo real com o tempo.

## Anti-padrões a evitar

- Chat de IA sugerindo um preço "do nada" sem citar de onde tirou (histórico
  ou ajuste de demanda) — sempre expor a fonte do número na resposta.
- Chamar a API do Monday a cada re-render da tela — cachear e só revalidar
  quando o usuário pedir ou ao abrir o projeto.
