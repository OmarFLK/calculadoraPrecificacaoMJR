---
name: cost-fields-arquitetura
description: Use esta skill sempre que for adicionar, editar ou renderizar campos de custo na calculadora de precificação. Cobre o schema declarativo de áreas de projeto, campos universais vs específicos, e como estender sem tocar em lógica de UI.
---

# Arquitetura de Campos de Custo Dinâmicos

## Princípio central

**Área do projeto = configuração, não código.** Nunca escreva
`if (area === 'quimica_alimentos') { ... }` dentro de componentes de UI. A UI
sempre lê de um schema central; adicionar uma área nova é adicionar uma
entrada nesse schema.

## Estrutura do schema

```ts
type CampoCusto = {
  id: string;              // slug único, ex: "custo_material"
  label: string;           // texto exibido
  tipo: "moeda" | "numero" | "texto" | "lista_livre";
  obrigatorio?: boolean;
  ajuda?: string;          // tooltip opcional
};

type AreaProjeto = {
  id: string;               // ex: "quimica_alimentos"
  nome: string;              // ex: "Química de Alimentos"
  camposEspecificos: CampoCusto[];
};

const CAMPOS_UNIVERSAIS: CampoCusto[] = [
  { id: "custo_transporte", label: "Custo de transporte", tipo: "moeda" },
  { id: "custos_extras", label: "Custos extras/adicionais", tipo: "lista_livre" },
];

const AREAS: AreaProjeto[] = [
  {
    id: "quimica_alimentos",
    nome: "Química de Alimentos",
    camposEspecificos: [
      { id: "custo_material", label: "Custo de material", tipo: "moeda", obrigatorio: true },
      { id: "transporte_material", label: "Transporte do material", tipo: "moeda" },
    ],
  },
  {
    id: "cronogramas_producao",
    nome: "Cronogramas / Produção",
    camposEspecificos: [
      { id: "custo_transporte_equipe", label: "Custo de transporte da equipe", tipo: "moeda" },
    ],
  },
];
```

## Regra de renderização

O formulário sempre renderiza: `CAMPOS_UNIVERSAIS` + `area.camposEspecificos`
da área selecionada. Nunca o contrário (nunca liste área por área na UI).

## Checklist antes de adicionar uma área nova

1. Ela cabe só adicionando um objeto em `AREAS`? Se sim, pare — não mexa em
   mais nada.
2. Precisa de um `tipo` de campo que não existe ainda (ex: upload de arquivo,
   seletor de data)? Adicione o tipo no enum `CampoCusto.tipo` e o renderer
   correspondente — isso é a única exceção legítima pra tocar em código de UI.
3. Nunca duplique um campo universal dentro de `camposEspecificos` — se toda
   área vai precisar dele, ele é universal, ponto final.

## Transições visuais (ligado à Etapa 2 do projeto)

Ao trocar de área, os campos específicos devem entrar com uma transição
suave (fade + slide, ~200-250ms) — nunca aparecer/sumir seco. Isso é
responsabilidade do componente de renderização da lista, não do schema.

## Anti-padrões a evitar

- Lógica de cálculo de preço dentro do componente de campo — cálculo é
  responsabilidade de uma camada separada que lê os valores preenchidos, não
  da UI.
- Campos "quase iguais" com nomes diferentes por área (ex:
  `custo_transporte_material` numa área e `transporte_mat` noutra) — sempre
  reutilize o mesmo `id` de campo quando o conceito é o mesmo.
