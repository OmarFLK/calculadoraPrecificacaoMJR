import { BriefcaseBusiness, Clock, Coins, Percent } from "lucide-react";
import type { ReactNode } from "react";
import { calculateSuggestedPrice, formatCurrency } from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";

interface DashboardSummaryProps {
  projects: PricingProject[];
  selectedProject: PricingProject | undefined;
}

export default function DashboardSummary({ projects, selectedProject }: DashboardSummaryProps) {
  const calculation = calculateSuggestedPrice(selectedProject);
  const totalCharged = projects.reduce(
    (sum, project) => sum + (project.chargedValue === "" ? 0 : project.chargedValue),
    0,
  );
  const totalHours = projects.reduce(
    (sum, project) => sum + (project.totalWorkedHours === "" ? 0 : project.totalWorkedHours),
    0,
  );
  const averageMargin = getAverageMargin(projects);

  return (
    <section className="dashboard-section" aria-labelledby="dashboard-title">
      <div className="section-heading">
        <p className="section-kicker">Dashboard</p>
        <h2 id="dashboard-title">Resumo da precificação</h2>
      </div>

      <div className="dashboard-grid">
        <SummaryCard tone="emerald" icon={<Coins size={20} />} label="Preço final sugerido" value={formatCurrency(calculation.precoFinal)} />
        <SummaryCard tone="coral" icon={<BriefcaseBusiness size={20} />} label="Valor histórico total" value={formatCurrency(totalCharged)} />
        <SummaryCard tone="indigo" icon={<Clock size={20} />} label="Horas mapeadas" value={`${totalHours.toLocaleString("pt-BR")} h`} />
        <SummaryCard tone="gold" icon={<Percent size={20} />} label="Margem média" value={`${averageMargin.toFixed(1)}%`} />
      </div>
    </section>
  );
}

function SummaryCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: ReactNode;
  label: string;
  tone: "coral" | "emerald" | "gold" | "indigo";
  value: string;
}) {
  return (
    <article className={`summary-card ${tone}`}>
      <div className="summary-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function getAverageMargin(projects: PricingProject[]) {
  const margins = projects
    .map((project) => project.desiredProfitMargin)
    .filter((margin): margin is number => margin !== "");

  if (!margins.length) {
    return 0;
  }

  return margins.reduce((sum, margin) => sum + margin, 0) / margins.length;
}
