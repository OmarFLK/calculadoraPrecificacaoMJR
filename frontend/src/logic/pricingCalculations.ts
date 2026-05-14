import type { PricingCalculation, PricingProject } from "../types/pricing";

const toMoneyNumber = (value: number | "") => (value === "" ? 0 : value);

export const calculateSuggestedPrice = (
  project: PricingProject | undefined,
): PricingCalculation => {
  if (!project) {
    return {
      custoBase: 0,
      valorMargem: 0,
      valorImpostos: 0,
      multiplicador: 1,
      precoFinal: 0,
    };
  }

  const custoBase = toMoneyNumber(project.totalWorkedHours) * toMoneyNumber(project.hourValue);
  const valorMargem = custoBase * (1 + toMoneyNumber(project.desiredProfitMargin) / 100);
  const valorImpostos = valorMargem * (1 + toMoneyNumber(project.taxes) / 100);
  const multiplicador = project.complexityMultiplier === "" ? 1 : project.complexityMultiplier;
  const precoFinal = valorImpostos * multiplicador + toMoneyNumber(project.extraCosts);

  return {
    custoBase,
    valorMargem,
    valorImpostos,
    multiplicador,
    precoFinal,
  };
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
