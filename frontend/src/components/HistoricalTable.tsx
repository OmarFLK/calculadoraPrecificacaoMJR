import { Archive } from "lucide-react";
import { formatCurrency } from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";

interface HistoricalTableProps {
  projects: PricingProject[];
}

export default function HistoricalTable({ projects }: HistoricalTableProps) {
  return (
    <section className="surface-card historical-card" aria-labelledby="historical-title">
      <div className="panel-heading">
        <div className="panel-icon">
          <Archive size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="section-kicker">Referências</p>
          <h2 id="historical-title">Projetos históricos carregados</h2>
        </div>
      </div>

      <div className="mini-table-scroll">
        <table className="historical-table">
          <thead>
            <tr>
              <th>Projeto</th>
              <th>Núcleo</th>
              <th>Serviço</th>
              <th>Valor cobrado</th>
              <th>Complexidade</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id}>
                <td>{project.projectName || "Sem nome"}</td>
                <td>{project.nucleus || "-"}</td>
                <td>{project.service || "-"}</td>
                <td>{formatCurrency(project.chargedValue === "" ? 0 : project.chargedValue)}</td>
                <td>
                  <span className="complexity-pill">{project.complexity || "Não definida"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
