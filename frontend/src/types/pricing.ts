export type Nucleus =
  | "Tecnologia"
  | "Gestão Empresarial"
  | "Design"
  | "Gestão de Processos"
  | "Química e Alimentos";

export type TimeUnit = "dias" | "semanas" | "meses";

export type Complexity =
  | "Muito baixa"
  | "Baixa"
  | "Média"
  | "Alta"
  | "Muito alta";

export type CostFieldValue = number | "";

export interface AdditionalCost {
  id: string;
  description: string;
  amount: CostFieldValue;
}

export interface PricingProject {
  id: string;
  isHistorical: boolean;
  nucleus: Nucleus | "";
  service: string;
  projectName: string;
  chargedValue: number | "";
  referenceTicket: number | "";
  executionTime: number | "";
  timeUnit: TimeUnit;
  totalWorkedHours: number | "";
  consultantsCount: number | "";
  weeklyHoursAverage: number | "";
  hourValue: number | "";
  desiredProfitMargin: number | "";
  taxes: number | "";
  extraCosts: number | "";
  costValues: Record<string, CostFieldValue>;
  additionalCosts: AdditionalCost[];
  complexity: Complexity | "";
  complexityMultiplier: number | "";
  context: string;
  driveLink: string;
}

export interface PricingCalculation {
  custoBase: number;
  custosDinamicos: number;
  valorMargem: number;
  valorImpostos: number;
  multiplicador: number;
  precoFinal: number;
}

export interface HistoricalPricingSuggestion {
  area: Nucleus | "";
  sampleCount: number;
  medianPrice: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
}
