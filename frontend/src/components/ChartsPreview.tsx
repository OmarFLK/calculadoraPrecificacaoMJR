import { SlidersHorizontal } from "lucide-react";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { COMPLEXITY_MULTIPLIERS, NUCLEUS_SERVICES } from "../data/services";
import type { Complexity, Nucleus, PricingProject } from "../types/pricing";

interface ChartsPreviewProps {
  projects: PricingProject[];
}

interface ChartFilters {
  analysisType: AnalysisType;
  complexity: Complexity | "Todos";
  consultantRange: RangeFilter;
  executionRange: RangeFilter;
  marginRange: RangeFilter;
  nucleus: Nucleus | "Todos";
  ticketRange: RangeFilter;
  visualization: VisualizationType;
}

type AnalysisType = "Receita por núcleo" | "Projetos por núcleo" | "Ticket médio por núcleo";
type VisualizationType = "Núcleo" | "Complexidade";
type RangeFilter = "Todas" | "Baixa" | "Média" | "Alta";

const defaultFilters: ChartFilters = {
  analysisType: "Receita por núcleo",
  complexity: "Todos",
  consultantRange: "Todas",
  executionRange: "Todas",
  marginRange: "Todas",
  nucleus: "Todos",
  ticketRange: "Todas",
  visualization: "Núcleo",
};

export default function ChartsPreview({ projects }: ChartsPreviewProps) {
  const [draftFilters, setDraftFilters] = useState<ChartFilters>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<ChartFilters>(defaultFilters);
  const filteredProjects = useMemo(
    () => filterProjects(projects, activeFilters),
    [activeFilters, projects],
  );
  const revenueRows = buildBarRows(filteredProjects, activeFilters);
  const distributionRows = buildDistributionRows(filteredProjects, activeFilters.visualization);
  const donutSegments = buildDonutSegments(distributionRows);

  return (
    <section className="surface-card charts-card" aria-labelledby="charts-title">
      <div className="card-toolbar">
        <div>
          <p className="section-kicker">Analytics</p>
          <h2 id="charts-title">Dashboard Analítico</h2>
        </div>
      </div>

      <div className="analytics-layout">
        <ChartFiltersPanel
          filters={draftFilters}
          onApply={() => setActiveFilters(draftFilters)}
          onChange={setDraftFilters}
        />

        <div className="charts-grid">
          <BarChartBlock title={activeFilters.analysisType} rows={revenueRows} />
          <DonutChartBlock
            title={`Distribuição por ${activeFilters.visualization.toLowerCase()}`}
            rows={distributionRows}
            segments={donutSegments}
          />
        </div>
      </div>
    </section>
  );
}

function ChartFiltersPanel({
  filters,
  onApply,
  onChange,
}: {
  filters: ChartFilters;
  onApply: () => void;
  onChange: (filters: ChartFilters) => void;
}) {
  const updateFilter = <Key extends keyof ChartFilters>(key: Key, value: ChartFilters[Key]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <aside className="filters-panel" aria-label="Filtros dos gráficos">
      <div className="filters-heading">
        <SlidersHorizontal size={18} aria-hidden="true" />
        <div>
          <p className="section-kicker">Filtros</p>
          <h3>Visualização</h3>
        </div>
      </div>

      <FilterSelect
        label="Visualização"
        value={filters.visualization}
        options={["Núcleo", "Complexidade"]}
        onChange={(value) => updateFilter("visualization", value as VisualizationType)}
      />
      <FilterSelect
        label="Núcleo"
        value={filters.nucleus}
        options={["Todos", ...Object.keys(NUCLEUS_SERVICES)]}
        onChange={(value) => updateFilter("nucleus", value as ChartFilters["nucleus"])}
      />
      <FilterSelect
        label="Complexidade"
        value={filters.complexity}
        options={["Todos", ...Object.keys(COMPLEXITY_MULTIPLIERS)]}
        onChange={(value) => updateFilter("complexity", value as ChartFilters["complexity"])}
      />
      <FilterSelect
        label="Faixa de ticket médio"
        value={filters.ticketRange}
        options={["Todas", "Baixa", "Média", "Alta"]}
        onChange={(value) => updateFilter("ticketRange", value as RangeFilter)}
      />
      <FilterSelect
        label="Quantidade de consultores"
        value={filters.consultantRange}
        options={["Todas", "Baixa", "Média", "Alta"]}
        onChange={(value) => updateFilter("consultantRange", value as RangeFilter)}
      />
      <FilterSelect
        label="Tempo de execução"
        value={filters.executionRange}
        options={["Todas", "Baixa", "Média", "Alta"]}
        onChange={(value) => updateFilter("executionRange", value as RangeFilter)}
      />
      <FilterSelect
        label="Faixa de margem"
        value={filters.marginRange}
        options={["Todas", "Baixa", "Média", "Alta"]}
        onChange={(value) => updateFilter("marginRange", value as RangeFilter)}
      />
      <FilterSelect
        label="Tipo de análise"
        value={filters.analysisType}
        options={["Receita por núcleo", "Projetos por núcleo", "Ticket médio por núcleo"]}
        onChange={(value) => updateFilter("analysisType", value as AnalysisType)}
      />

      <button className="primary-button" type="button" onClick={onApply}>
        Atualizar visualização
      </button>
    </aside>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function BarChartBlock({ title, rows }: { title: string; rows: ChartRow[] }) {
  return (
    <div className="chart-block">
      <h3>{title}</h3>
      <div className="column-chart" aria-label={title}>
        {rows.map((row) => (
          <div className="column-item" key={row.label}>
            <strong>{row.displayValue}</strong>
            <div className="column-track">
              <div className="column-fill" style={{ height: `${row.percent}%` }} />
            </div>
            <span>{shortenLabel(row.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChartBlock({
  title,
  rows,
  segments,
}: {
  title: string;
  rows: ChartRow[];
  segments: DonutSegment[];
}) {
  return (
    <div className="chart-block donut-block">
      <h3>{title}</h3>
      <div className="donut-layout">
        <div className="donut-chart" style={{ "--donut": segments.map((segment) => segment.slice).join(", ") } as CSSProperties}>
          <div>
            <strong>{rows.reduce((sum, row) => sum + row.value, 0)}</strong>
            <span>projetos</span>
          </div>
        </div>
        <div className="donut-legend">
          {segments.map((segment) => (
            <div key={segment.label}>
              <span style={{ background: segment.color }} />
              <p>{segment.label}</p>
              <strong>{segment.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ChartRow {
  displayValue: string;
  label: string;
  value: number;
  percent: number;
}

interface DonutSegment {
  color: string;
  label: string;
  slice: string;
  value: number;
}

const DONUT_COLORS = ["#16946b", "#ef6c57", "#5965d8", "#e1b63f", "#38a6a0", "#c43f5d"];

function buildBarRows(projects: PricingProject[], filters: ChartFilters) {
  if (filters.analysisType === "Projetos por núcleo") {
    return buildNucleusDistributionRows(projects);
  }

  if (filters.analysisType === "Ticket médio por núcleo") {
    return buildAverageTicketRows(projects);
  }

  return buildRevenueRows(projects);
}

function buildRevenueRows(projects: PricingProject[]) {
  const totals = projects.reduce<Record<string, number>>((accumulator, project) => {
    const nucleus = project.nucleus || "Sem núcleo";
    const chargedValue = project.chargedValue === "" ? 0 : project.chargedValue;
    accumulator[nucleus] = (accumulator[nucleus] ?? 0) + chargedValue;
    return accumulator;
  }, {});

  return toChartRows(totals, formatCompactCurrency);
}

function buildAverageTicketRows(projects: PricingProject[]) {
  const totals = projects.reduce<Record<string, { count: number; value: number }>>((accumulator, project) => {
    const nucleus = project.nucleus || "Sem núcleo";
    const chargedValue = project.chargedValue === "" ? 0 : project.chargedValue;
    const currentValue = accumulator[nucleus] ?? { count: 0, value: 0 };
    accumulator[nucleus] = {
      count: currentValue.count + 1,
      value: currentValue.value + chargedValue,
    };
    return accumulator;
  }, {});

  const averages = Object.fromEntries(
    Object.entries(totals).map(([nucleus, total]) => [
      nucleus,
      total.count ? total.value / total.count : 0,
    ]),
  );

  return toChartRows(averages, formatCompactCurrency);
}

function buildDistributionRows(projects: PricingProject[], visualization: VisualizationType) {
  if (visualization === "Complexidade") {
    const counts = countBy(projects.map((project) => project.complexity || "Não definida"));
    return toChartRows(counts, (value) => String(value));
  }

  return buildNucleusDistributionRows(projects);
}

function buildNucleusDistributionRows(projects: PricingProject[]) {
  const counts = countBy(projects.map((project) => project.nucleus || "Sem núcleo"));
  return toChartRows(counts, (value) => String(value));
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((accumulator, value) => {
    accumulator[value] = (accumulator[value] ?? 0) + 1;
    return accumulator;
  }, {});
}

function toChartRows(counts: Record<string, number>, formatValue: (value: number) => string) {
  if (!Object.keys(counts).length) {
    return [{ displayValue: "0", label: "Sem dados", value: 0, percent: 10 }];
  }

  const maxValue = Math.max(...Object.values(counts), 1);

  return Object.entries(counts).map(([label, value]) => ({
    displayValue: formatValue(value),
    label,
    value,
    percent: Math.max(10, (value / maxValue) * 100),
  }));
}

function buildDonutSegments(rows: ChartRow[]) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  let cursor = 0;

  if (rows.length === 1 && rows[0].value === 0) {
    return [{
      color: "#dce3de",
      label: rows[0].label,
      slice: "#dce3de 0% 100%",
      value: 0,
    }];
  }

  return rows.map((row, index) => {
    const start = cursor;
    const size = (row.value / total) * 100;
    const end = start + size;
    const color = DONUT_COLORS[index % DONUT_COLORS.length];
    cursor = end;

    return {
      color,
      label: row.label,
      slice: `${color} ${start}% ${end}%`,
      value: row.value,
    };
  });
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortenLabel(label: string) {
  const labels: Record<string, string> = {
    "Gestão Empresarial": "Gestão Emp.",
    "Gestão de Processos": "Processos",
    "Química e Alimentos": "Química",
  };

  return labels[label] ?? label;
}

function filterProjects(projects: PricingProject[], filters: ChartFilters) {
  return projects.filter((project) => {
    return (
      matchesExactFilter(project.nucleus, filters.nucleus) &&
      matchesExactFilter(project.complexity, filters.complexity) &&
      matchesTicketRange(project, filters.ticketRange) &&
      matchesNumberRange(project.consultantsCount, filters.consultantRange, [3, 5]) &&
      matchesNumberRange(project.executionTime, filters.executionRange, [5, 9]) &&
      matchesNumberRange(project.desiredProfitMargin, filters.marginRange, [24, 28])
    );
  });
}

function matchesExactFilter(value: string, filter: string) {
  return filter === "Todos" || value === filter;
}

function matchesTicketRange(project: PricingProject, range: RangeFilter) {
  const ticket = project.referenceTicket === "" ? project.chargedValue : project.referenceTicket;
  return matchesNumberRange(ticket, range, [15000, 28000]);
}

function matchesNumberRange(value: number | "", range: RangeFilter, limits: [number, number]) {
  if (range === "Todas") {
    return true;
  }

  const numericValue = value === "" ? 0 : value;
  const [lowLimit, highLimit] = limits;

  if (range === "Baixa") {
    return numericValue < lowLimit;
  }

  if (range === "Média") {
    return numericValue >= lowLimit && numericValue <= highLimit;
  }

  return numericValue > highLimit;
}
