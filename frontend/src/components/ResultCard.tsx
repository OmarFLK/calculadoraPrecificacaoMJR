import { Calculator, Database, TrendingUp } from "lucide-react";
import {
  calculateHistoricalSuggestion,
  calculateSuggestedPrice,
  formatCurrency,
} from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";

interface ResultCardProps {
  project: PricingProject | undefined;
  projects: PricingProject[];
}

export default function ResultCard({ project, projects }: ResultCardProps) {
  const calculation = calculateSuggestedPrice(project);
  const historicalSuggestion = calculateHistoricalSuggestion(project, projects);
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
        <span>Preço final sugerido</span>
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

      <dl className="metric-list">
        <Metric label="Custo base" value={formatCurrency(calculation.custoBase)} />
        <Metric label="Valor com margem" value={formatCurrency(calculation.valorMargem)} />
        <Metric label="Valor com impostos" value={formatCurrency(calculation.valorImpostos)} />
        <Metric label="Custos do projeto" value={formatCurrency(calculation.custosDinamicos)} />
        <Metric label="Multiplicador" value={calculation.multiplicador.toFixed(2)} />
      </dl>

      <div className="result-note">
        <TrendingUp size={16} aria-hidden="true" />
        <span>Baseado em horas, margem, impostos, complexidade e custos configurados.</span>
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
