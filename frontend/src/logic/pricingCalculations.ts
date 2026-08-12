import type {
  HistoricalPricingSuggestion,
  PricingCalculation,
  PricingProject,
} from "../types/pricing";
import { calculateServiceMultiplier } from "../data/serviceMultipliers";

const toMoneyNumber = (value: number | "") => (value === "" ? 0 : value);

export const calculateDynamicCosts = (project: PricingProject): number => {
  const configuredCosts = Object.values(project.costValues).reduce<number>(
    (total, value) => total + toMoneyNumber(value),
    0,
  );

  return configuredCosts + toMoneyNumber(project.extraCosts);
};

export const calculateSuggestedPrice = (
  project: PricingProject | undefined,
): PricingCalculation => {
  if (!project) {
    return {
      custoBase: 0,
      custosDinamicos: 0,
      valorMargem: 0,
      valorImpostos: 0,
      multiplicador: 1,
      multiplicadorComplexidade: 1,
      multiplicadorServico: 1,
      precoFinal: 0,
    };
  }

  const custoBase = toMoneyNumber(project.totalWorkedHours) * toMoneyNumber(project.hourValue);
  const valorMargem = custoBase * (1 + toMoneyNumber(project.desiredProfitMargin) / 100);
  const valorImpostos = valorMargem * (1 + toMoneyNumber(project.taxes) / 100);
  const multiplicadorComplexidade = project.complexityMultiplier === "" ? 1 : project.complexityMultiplier;
  const multiplicadorServico = calculateServiceMultiplier(
    project.nucleus,
    project.service,
    project.serviceMultiplierValues,
  ).multiplier;
  const multiplicador = multiplicadorComplexidade * multiplicadorServico;
  const custosDinamicos = calculateDynamicCosts(project);
  const precoFinal = valorImpostos * multiplicador + custosDinamicos;

  return {
    custoBase,
    custosDinamicos,
    valorMargem,
    valorImpostos,
    multiplicador,
    multiplicadorComplexidade,
    multiplicadorServico,
    precoFinal,
  };
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);

export const calculateHistoricalSuggestion = (
  project: PricingProject | undefined,
  historicalProjects: PricingProject[],
): HistoricalPricingSuggestion => {
  const area = project?.nucleus ?? "";
  const prices = historicalProjects
    .filter(
      (historicalProject) =>
        historicalProject.isHistorical &&
        area &&
        historicalProject.nucleus === area &&
        historicalProject.chargedValue !== "",
    )
    .map((historicalProject) => Number(historicalProject.chargedValue))
    .sort((firstPrice, secondPrice) => firstPrice - secondPrice);

  if (!prices.length) {
    return {
      area,
      sampleCount: 0,
      medianPrice: null,
      minimumPrice: null,
      maximumPrice: null,
    };
  }

  const middleIndex = Math.floor(prices.length / 2);
  const medianPrice = prices.length % 2
    ? prices[middleIndex]
    : (prices[middleIndex - 1] + prices[middleIndex]) / 2;

  return {
    area,
    sampleCount: prices.length,
    medianPrice,
    minimumPrice: prices[0],
    maximumPrice: prices[prices.length - 1],
  };
};
