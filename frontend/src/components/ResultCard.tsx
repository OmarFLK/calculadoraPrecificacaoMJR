import { Activity, Calculator, Database, TrendingUp } from "lucide-react";
import {
  calculateHistoricalSuggestion,
  calculateSuggestedPrice,
  formatCurrency,
} from "../logic/pricingCalculations";
import { calculateServiceMultiplier } from "../data/serviceMultipliers";
import { calculateArchitecturePricing } from "../logic/architecturePricing";
import type { PricingProject } from "../types/pricing";
import type { MondayDemandSignal } from "./MondayDemandCard";

interface ResultCardProps {
  project: PricingProject | undefined;
  projects: PricingProject[];
  mondayDemandSignal?: MondayDemandSignal | null;
}

export default function ResultCard({ project, projects, mondayDemandSignal }: ResultCardProps) {
  const calculation = calculateSuggestedPrice(project);
  const architectureCalculation = calculateArchitecturePricing(project);
  const historicalSuggestion = calculateHistoricalSuggestion(project, projects);
  const serviceSummary = calculateServiceMultiplier(
    project?.nucleus ?? "",
    project?.service ?? "",
    project?.serviceMultiplierValues,
  );
  const title = project?.projectName || "Linha selecionada";

  return (
    <section className="surface-card result-card" aria-labelledby="result-title">
      <div className="panel-heading">
        <div className="panel-icon">
          <Calculator size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="section-kicker">Resultado simulado</p>
          <h2 id="result-title">{title}</h2>
        </div>
      </div>

      <div className="result-price">
        <span>{architectureCalculation ? "Valor bruto sugerido" : "Preço final sugerido"}</span>
        <strong>{formatCurrency(calculation.precoFinal)}</strong>
      </div>

      <div className="historical-suggestion">
        <Database size={18} aria-hidden="true" />
        <div>
          <span>Mediana histórica</span>
          <strong>
            {historicalSuggestion.medianPrice === null
              ? "Sem histórico para a área"
              : formatCurrency(historicalSuggestion.medianPrice)}
          </strong>
        </div>
        <small>
          {historicalSuggestion.sampleCount} projeto
          {historicalSuggestion.sampleCount === 1 ? "" : "s"}
        </small>
      </div>

      {mondayDemandSignal ? (
        <div className="monday-reference">
          <Activity size={18} aria-hidden="true" />
          <div>
            <span>Referência por demanda no monday.com</span>
            <strong>{formatCurrency(calculation.precoFinal * (1 + mondayDemandSignal.adjustmentPercentage / 100))}</strong>
          </div>
          <small>+{mondayDemandSignal.adjustmentPercentage}% · não aplicado automaticamente</small>
        </div>
      ) : null}

      {architectureCalculation ? (
        <>
          <dl className="metric-list">
            <Metric label="Folhas / plantas" value={String(architectureCalculation.sheetCount)} />
            <Metric label="Área total" value={`${architectureCalculation.totalSquareMeters.toLocaleString("pt-BR")} m²`} />
            <Metric label="Valor por m²" value={formatCurrency(architectureCalculation.squareMeterRate)} />
            <Metric label="Valor da área" value={formatCurrency(architectureCalculation.areaValue)} />
            <Metric label="Mão de obra" value={formatCurrency(architectureCalculation.consultantLaborCost)} />
            <Metric label="Custos indiretos" value={formatCurrency(architectureCalculation.indirectCosts)} />
            <Metric label="Custo" value={formatCurrency(architectureCalculation.totalCost)} />
            <Metric label="Imposto" value={formatCurrency(architectureCalculation.taxAmount)} />
            <Metric label="Valor líquido" value={formatCurrency(architectureCalculation.netValue)} />
          </dl>
          <details className="calculation-details">
            <summary>Ver memória de cálculo da planilha</summary>
            <ul>
              <li><span>Custo</span><strong>indiretos + (hora × consultores × horas)</strong></li>
              <li><span>Valor bruto</span><strong>(m² × valor/m²) + custo</strong></li>
              <li><span>Valor líquido</span><strong>valor bruto − imposto</strong></li>
            </ul>
          </details>
        </>
      ) : (
        <dl className="metric-list">
          <Metric label="Custo base" value={formatCurrency(calculation.custoBase)} />
          <Metric label="Valor com margem" value={formatCurrency(calculation.valorMargem)} />
          <Metric label="Valor com impostos" value={formatCurrency(calculation.valorImpostos)} />
          <Metric label="Custos do projeto" value={formatCurrency(calculation.custosDinamicos)} />
          <Metric label="Complexidade" value={`× ${calculation.multiplicadorComplexidade.toFixed(2)}`} />
          <Metric label="Variáveis do serviço" value={`× ${calculation.multiplicadorServico.toFixed(2)}`} />
          <Metric label="Multiplicador combinado" value={`× ${calculation.multiplicador.toFixed(2)}`} />
        </dl>
      )}

      {!architectureCalculation && serviceSummary.selections.length ? (
        <details className="calculation-details">
          <summary>Ver memória de cálculo das variáveis</summary>
          <ul>
            {serviceSummary.selections.map((selection) => (
              <li key={selection.questionId}>
                <span>{selection.questionLabel}: {selection.optionLabel}</span>
                <strong>{selection.multiplier === null ? "Revisar" : `× ${selection.multiplier.toFixed(2)}`}</strong>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className="result-note">
        <TrendingUp size={16} aria-hidden="true" />
        <span>
          {architectureCalculation
            ? "Cálculo reproduzido da planilha do Núcleo Civil e Arquitetura."
            : "Baseado em horas, margem, impostos, complexidade, regras do serviço e custos configurados."}
        </span>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
