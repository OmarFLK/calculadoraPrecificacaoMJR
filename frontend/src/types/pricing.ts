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

export interface PricingProject {
  id: string;
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
  complexity: Complexity | "";
  complexityMultiplier: number | "";
  context: string;
  driveLink: string;
}

export interface PricingCalculation {
  custoBase: number;
  valorMargem: number;
  valorImpostos: number;
  multiplicador: number;
  precoFinal: number;
}
