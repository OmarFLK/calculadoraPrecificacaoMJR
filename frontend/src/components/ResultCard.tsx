import { Calculator, TrendingUp } from "lucide-react";
import { calculateSuggestedPrice, formatCurrency } from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";

interface ResultCardProps {
  project: PricingProject | undefined;
}

export default function ResultCard({ project }: ResultCardProps) {
  const calculation = calculateSuggestedPrice(project);
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
