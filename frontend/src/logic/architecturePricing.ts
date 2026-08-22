import type {
  ArchitectureFinishLevel,
  ArchitecturePricingCalculation,
  CostFieldValue,
  PricingProject,
} from "../types/pricing";

export const ARCHITECTURE_NUCLEUS = "Arquitetura e Civil" as const;

const SERVICE_SQUARE_METER_RATES: Record<string, Record<1 | 2 | 3, number>> = {
  "Projeto Arquitetônico — Concepção": { 1: 25, 2: 30, 3: 35 },
  // A tabela da planilha informa 30/35/40; as fórmulas internas ainda apontam
  // para 25/30/35. A tabela específica do serviço é a referência adotada.
  "Projeto Arquitetônico — Interiores": { 1: 30, 2: 35, 3: 40 },
  "Projeto Elétrico": { 1: 25, 2: 30, 3: 35 },
};

const toNumber = (value: CostFieldValue | undefined): number => value === "" || value === undefined ? 0 : value;

export const isArchitectureProject = (project: PricingProject | undefined): boolean =>
  project?.nucleus === ARCHITECTURE_NUCLEUS;

export function getArchitectureSquareMeterRate(
  service: string,
  finishLevel: ArchitectureFinishLevel,
): number {
  if (finishLevel === "") {
    return 0;
  }

  return SERVICE_SQUARE_METER_RATES[service]?.[finishLevel] ?? 0;
}

export function calculateArchitecturePricing(
  project: PricingProject | undefined,
): ArchitecturePricingCalculation | null {
  if (!project || !isArchitectureProject(project)) {
    return null;
  }

  const inputs = project.architecturePricing;
  const totalSquareMeters = inputs.sheetAreas.reduce<number>(
    (total, area) => total + toNumber(area),
    0,
  );
  const squareMeterRate = getArchitectureSquareMeterRate(project.service, inputs.finishLevel);
  const consultantLaborCost = toNumber(project.hourValue)
    * toNumber(project.consultantsCount)
    * toNumber(inputs.workHoursPerConsultant);
  const indirectCosts = toNumber(project.costValues.transport_cost)
    + toNumber(inputs.professorArtCost)
    + toNumber(inputs.artIssuanceCost)
    + toNumber(project.extraCosts);
  const totalCost = consultantLaborCost + indirectCosts;
  const areaValue = totalSquareMeters * squareMeterRate;
  const grossValue = areaValue + totalCost;
  const taxAmount = grossValue * (toNumber(project.taxes) / 100);

  return {
    areaValue,
    consultantLaborCost,
    finishLevel: inputs.finishLevel,
    grossValue,
    indirectCosts,
    netValue: grossValue - taxAmount,
    sheetCount: inputs.sheetAreas.length,
    squareMeterRate,
    taxAmount,
    totalCost,
    totalSquareMeters,
  };
}
