import type { Nucleus } from "../types/pricing";

export interface MultiplierOption {
  value: string;
  label: string;
  multiplier: number | null;
  note?: string;
}

export interface MultiplierQuestion {
  id: string;
  label: string;
  help?: string;
  options: MultiplierOption[];
}

export interface MultiplierSelection {
  questionId: string;
  questionLabel: string;
  optionLabel: string;
  multiplier: number | null;
  note?: string;
}

export interface ServiceMultiplierSummary {
  multiplier: number;
  answeredCount: number;
  totalQuestions: number;
  reviewRequired: boolean;
  selections: MultiplierSelection[];
}

const option = (value: string, label: string, multiplier: number, note?: string): MultiplierOption => ({
  value,
  label,
  multiplier,
  note,
});

const scopeFactor = (factor: number): MultiplierOption[] => [
  option("not_applicable", "Não se aplica ao escopo", 1),
  option("applicable", "Aplica-se ao escopo", factor),
];

const rawMaterialOptions: MultiplierOption[] = [
  option("client", "Fornecida pelo cliente", 1),
  option("maua", "Fornecida pela Mauá Jr.", 1),
];

const sampleLocationOptions: MultiplierOption[] = [
  option("sp", "São Paulo", 0.85),
  option("other_states", "Outros estados", 1.25),
];

const quantityProducts = (id = "product_quantity"): MultiplierQuestion => ({
  id,
  label: "Quantidade de produtos estudados",
  help: "O manual define o fator 1,15 quando esta variável impacta o escopo.",
  options: scopeFactor(1.15),
});

const quantityTests = (): MultiplierQuestion => ({
  id: "test_quantity",
  label: "Quantidade de testes a realizar",
  help: "O manual define o fator 1,15 quando esta variável impacta o escopo.",
  options: scopeFactor(1.15),
});

const testComplexity = (): MultiplierQuestion => ({
  id: "test_complexity",
  label: "Complexidade dos testes",
  help: "O manual define o fator 1,25 quando esta variável impacta o escopo.",
  options: scopeFactor(1.25),
});

const productComplexity = (): MultiplierQuestion => ({
  id: "product_complexity",
  label: "Complexidade dos produtos testados",
  help: "O manual define o fator 1,25 quando esta variável impacta o escopo.",
  options: scopeFactor(1.25),
});

const rawMaterial = (): MultiplierQuestion => ({
  id: "raw_material_source",
  label: "Disponibilidade da matéria-prima",
  options: rawMaterialOptions,
});

const sampleLocation = (): MultiplierQuestion => ({
  id: "sample_location",
  label: "Localização para envio de amostras",
  options: sampleLocationOptions,
});

export const SERVICE_MULTIPLIER_RULES: Partial<
  Record<Nucleus, Record<string, MultiplierQuestion[]>>
> = {
  "Gestão Empresarial": {
    "Pesquisa de Mercado": [
      {
        id: "respondents",
        label: "Número de respondentes",
        options: [
          option("up_to_50", "Até 50", 1),
          option("51_100", "51 a 100", 1.1),
          option("101_200", "101 a 200", 1.25),
          option("201_400", "201 a 400", 1.45),
          option("above_400", "Acima de 400", 1.7),
        ],
      },
      {
        id: "research_type",
        label: "Tipo de pesquisa",
        options: [
          option("quantitative", "Apenas quantitativa", 1),
          option("qualitative", "Apenas qualitativa", 1.2),
          option("mixed", "Quantitativa + qualitativa", 1.3),
        ],
      },
      {
        id: "online_share",
        label: "Parcela realizada online",
        options: [
          option("100", "100% online", 1),
          option("80", "80% online", 1.05),
          option("60", "60% online", 1.1),
          option("40", "40% online", 1.15),
          option("20", "20% online", 1.2),
          option("0", "0% online", 1.3),
        ],
      },
      {
        id: "segments",
        label: "Número de segmentos / públicos-alvo",
        options: [
          option("one", "Um público-alvo", 1),
          option("two", "Dois públicos-alvo", 1.1),
          option("three_plus", "Três ou mais", 1.25),
        ],
      },
      {
        id: "form_questions",
        label: "Complexidade do formulário",
        help: "O manual não informa um multiplicador específico para exatamente 31 perguntas.",
        options: [
          option("up_to_15", "Até 15 perguntas", 1),
          option("16_30", "16 a 30 perguntas", 1.1),
          {
            value: "31",
            label: "31 perguntas — validar com o núcleo",
            multiplier: null,
            note: "Faixa sem multiplicador definido no manual.",
          },
          option("above_31", "Mais de 31 perguntas", 1.25),
        ],
      },
      {
        id: "audience_difficulty",
        label: "Dificuldade de acesso ao público",
        options: [
          option("open", "Público aberto", 1),
          option("client_contacts", "Cliente fornece contatos", 1.05),
          option("own_contacts", "Mauá Jr. possui contatos", 1.1),
          option("specific", "Público específico", 1.2),
          option("very_difficult", "Muito difícil e sem contatos", 1.35),
        ],
      },
      {
        id: "cities",
        label: "Abrangência geográfica",
        options: [
          option("sp", "Apenas São Paulo", 1),
          option("other_state_partner", "Outro estado com apoio de EJ", 1.2),
          option("several_states", "Diversos estados", 1.55),
        ],
      },
      {
        id: "open_questions",
        label: "Perguntas abertas",
        help: "O manual anexado não informa um multiplicador para a faixa de 11 a 20 perguntas.",
        options: [
          option("none", "Nenhuma", 1),
          option("up_to_5", "Até 5", 1.05),
          option("6_10", "6 a 10", 1.1),
          {
            value: "11_20",
            label: "11 a 20 — validar com o núcleo",
            multiplier: null,
            note: "Faixa sem multiplicador definido no manual.",
          },
          option("above_20", "Mais de 20", 1.2),
        ],
      },
    ],
    "Plano de Marketing": [
      {
        id: "market_research",
        label: "Pesquisa de mercado",
        options: [
          option("none", "Não inclusa", 1),
          option("simple", "Simples — até 100 respostas", 1.1),
          option("complex", "Complexa", 1.2),
        ],
      },
      {
        id: "sector_complexity",
        label: "Complexidade do setor",
        options: [option("low", "Baixa", 1), option("medium", "Média", 1.1), option("high", "Alta", 1.2)],
      },
      {
        id: "competitors",
        label: "Concorrentes analisados",
        options: [
          option("up_to_3", "Até 3", 1),
          option("4_7", "4 a 7", 1.15),
          {
            value: "8",
            label: "8 — validar com o núcleo",
            multiplier: null,
            note: "O manual encerra uma faixa em 7 e inicia a próxima acima de 8.",
          },
          option("above_8", "Mais de 8", 1.3),
        ],
      },
      {
        id: "personas",
        label: "Número de personas",
        help: "O manual não informa um multiplicador específico para exatamente três personas.",
        options: [
          option("one", "Uma", 1),
          option("two", "Duas", 1.1),
          {
            value: "three",
            label: "Três — validar com o núcleo",
            multiplier: null,
            note: "Faixa sem multiplicador definido no manual.",
          },
          option("above_three", "Mais de três", 1.2),
        ],
      },
      {
        id: "okrs",
        label: "Quantidade de OKRs",
        options: [
          option("none", "Não terá", 1),
          option("up_to_3", "Até 3", 1.05),
          option("4_6", "4 a 6", 1.1),
          option("above_6", "Mais de 6", 1.15),
        ],
      },
      {
        id: "action_plan",
        label: "Detalhamento do plano de ação",
        options: [
          option("diagnosis", "Apenas diagnóstico", 1),
          option("strategies", "Diagnóstico + estratégias", 1.2),
          option("full", "Estratégias + cronograma + KPIs", 1.4),
        ],
      },
    ],
    "Análise Financeira": [
      {
        id: "financial_organization",
        label: "Organização dos dados financeiros",
        options: [
          option("organized", "Dados organizados", 1),
          option("partial", "Parcialmente organizados", 1.1),
          option("disorganized", "Tudo desorganizado", 1.2),
        ],
      },
      {
        id: "cash_flow",
        label: "Fluxo de caixa",
        options: [
          option("exists", "Cliente já possui", 1),
          option("review", "Revisão do existente", 1.05),
          option("new", "Criar novo", 1.15),
        ],
      },
      {
        id: "dre",
        label: "DRE",
        options: [
          option("exists", "Cliente já possui", 1),
          option("analysis", "Análise do existente", 1.05),
          option("from_scratch", "Estruturar do zero", 1.1),
        ],
      },
      {
        id: "financial_indicators",
        label: "Indicadores financeiros",
        options: [
          option("none", "Sem indicadores", 1),
          option("basic", "Básicos", 1.05),
          option("intermediate", "Intermediários", 1.1),
          option("advanced", "Avançados", 1.2),
        ],
      },
      {
        id: "spreadsheets",
        label: "Planilhas",
        options: [
          option("adjust", "Ajustar existentes", 1),
          option("from_scratch", "Criar do zero", 1.1),
          option("automated", "Automatizadas", 1.15),
        ],
      },
    ],
    "Plano de Negócio": [
      {
        id: "business_stage",
        label: "Estágio do negócio",
        options: [option("existing", "Empresa existente", 1), option("new", "Novo negócio", 1.15)],
      },
      {
        id: "market_research",
        label: "Pesquisa de mercado",
        options: [
          option("none", "Não precisa", 1),
          option("basic", "Básica — até 100 respostas", 1.1),
          option("complex", "Complexa", 1.2),
        ],
      },
      {
        id: "financial_analysis",
        label: "Análise financeira",
        options: [option("none", "Não precisa", 1), option("simple", "Simples", 1.05), option("complex", "Complexa", 1.1)],
      },
      {
        id: "marketing_plan",
        label: "Plano de marketing",
        options: [option("none", "Não precisa", 1), option("basic", "Estratégia básica", 1.05), option("full", "Plano completo", 1.1)],
      },
    ],
  },
  "Química e Alimentos": {
    "Pesquisa de Rota Produtiva": [testComplexity(), quantityProducts(), quantityTests(), rawMaterial()],
    "Estudo e Desenvolvimento de Cosméticos": [quantityProducts(), quantityTests(), rawMaterial(), productComplexity(), sampleLocation()],
    "Formulação de Alimentos": [quantityProducts(), quantityTests(), rawMaterial(), productComplexity(), sampleLocation()],
    "Estudo de Embalagem": [quantityProducts()],
    "Rotulagem de Produtos": [quantityProducts()],
    "Análise de Componentes": [quantityProducts(), testComplexity(), quantityTests(), rawMaterial(), sampleLocation()],
    "Manual BPF": [
      {
        id: "technical_visit",
        label: "Visita técnica no local do cliente",
        help: "O manual define o fator 1,25 para a localização da visita técnica.",
        options: scopeFactor(1.25),
      },
    ],
  },
};

export function getServiceMultiplierQuestions(
  nucleus: Nucleus | "",
  service: string,
): MultiplierQuestion[] {
  if (!nucleus || !service) {
    return [];
  }
  return SERVICE_MULTIPLIER_RULES[nucleus]?.[service] ?? [];
}

export function calculateServiceMultiplier(
  nucleus: Nucleus | "",
  service: string,
  values: Record<string, string> | undefined,
): ServiceMultiplierSummary {
  const questions = getServiceMultiplierQuestions(nucleus, service);
  const selections = questions.flatMap<MultiplierSelection>((question) => {
    const selectedValue = values?.[question.id];
    const selectedOption = question.options.find((candidate) => candidate.value === selectedValue);
    return selectedOption
      ? [{
          questionId: question.id,
          questionLabel: question.label,
          optionLabel: selectedOption.label,
          multiplier: selectedOption.multiplier,
          note: selectedOption.note,
        }]
      : [];
  });
  const multiplier = selections.reduce(
    (total, selection) => total * (selection.multiplier ?? 1),
    1,
  );

  return {
    multiplier: Number(multiplier.toFixed(4)),
    answeredCount: selections.length,
    totalQuestions: questions.length,
    reviewRequired: selections.some((selection) => selection.multiplier === null),
    selections,
  };
}
