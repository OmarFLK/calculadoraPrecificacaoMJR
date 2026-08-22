export type Nucleus =
  | "Tecnologia"
  | "Gestão Empresarial"
  | "Design"
  | "Gestão de Processos"
  | "Química e Alimentos"
  | "Arquitetura e Civil";

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

export type ArchitectureFinishLevel = 1 | 2 | 3 | "";

export interface ArchitecturePricingInputs {
  artIssuanceCost: CostFieldValue;
  finishLevel: ArchitectureFinishLevel;
  professorArtCost: CostFieldValue;
  sheetAreas: CostFieldValue[];
  workHoursPerConsultant: CostFieldValue;
}

export interface PricingProject {
  id: string;
  isHistorical: boolean;
  savedAt?: string;
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
  serviceMultiplierValues: Record<string, string>;
  architecturePricing: ArchitecturePricingInputs;
  context: string;
  driveLink: string;
}

export interface PricingCalculation {
  custoBase: number;
  custosDinamicos: number;
  valorMargem: number;
  valorImpostos: number;
  multiplicador: number;
  multiplicadorComplexidade: number;
  multiplicadorServico: number;
  precoFinal: number;
}

export interface ArchitecturePricingCalculation {
  areaValue: number;
  consultantLaborCost: number;
  finishLevel: ArchitectureFinishLevel;
  grossValue: number;
  indirectCosts: number;
  netValue: number;
  sheetCount: number;
  squareMeterRate: number;
  taxAmount: number;
  totalCost: number;
  totalSquareMeters: number;
}

export interface HistoricalPricingSuggestion {
  area: Nucleus | "";
  sampleCount: number;
  medianPrice: number | null;
  minimumPrice: number | null;
  maximumPrice: number | null;
}
