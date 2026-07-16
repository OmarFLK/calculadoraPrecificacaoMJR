import { ChevronDown, ChevronUp, Edit3, History, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency } from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";

interface ProjectListProps {
  projects: PricingProject[];
  selectedProjectId: string;
  onRemoveProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
}

export default function ProjectList({
  projects,
  selectedProjectId,
  onRemoveProject,
  onSelectProject,
}: ProjectListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const totalChargedValue = useMemo(
    () => projects.reduce((total, project) => total + (project.chargedValue === "" ? 0 : project.chargedValue), 0),
    [projects],
  );

  return (
    <section className="surface-card list-card" aria-labelledby="project-list-title">
      <div className="card-toolbar">
        <div className="history-heading">
          <div className="panel-icon">
            <History size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="section-kicker">Histórico</p>
            <h2 id="project-list-title">Projetos e simulações</h2>
          </div>
        </div>

        <button
          className="secondary-button history-toggle"
          type="button"
          onClick={() => setIsOpen((currentValue) => !currentValue)}
          aria-expanded={isOpen}
          aria-controls="project-history-list"
        >
          {isOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          {isOpen ? "Ocultar histórico" : "Ver histórico"}
        </button>
      </div>

      <div className="history-summary">
        <div>
          <span>Total no histórico</span>
          <strong>{projects.length}</strong>
        </div>
        <div>
          <span>Projeto ativo</span>
          <strong>{selectedProject?.projectName || "Projeto sem nome"}</strong>
        </div>
        <div>
          <span>Valor histórico</span>
          <strong>{formatCurrency(totalChargedValue)}</strong>
        </div>
      </div>

      {isOpen ? (
      <div className="project-list" id="project-history-list">
        {projects.map((project) => (
          <article
            className={project.id === selectedProjectId ? "project-item active" : "project-item"}
            key={project.id}
          >
            <div>
              <h3>{project.projectName || "Projeto sem nome"}</h3>
              <p>{project.nucleus || "Núcleo não definido"} · {project.service || "Serviço não definido"}</p>
              <div className="project-tags">
                <span>{project.complexity || "Complexidade não definida"}</span>
                <span>{formatCurrency(project.chargedValue === "" ? 0 : project.chargedValue)}</span>
              </div>
            </div>
            <div className="project-actions">
              <button className="secondary-icon-button" type="button" title="Editar projeto" aria-label={`Editar ${project.projectName || "projeto"}`} onClick={() => onSelectProject(project.id)}>
                <Edit3 size={16} aria-hidden="true" />
              </button>
              <button className="danger-icon-button" type="button" title="Remover projeto" aria-label={`Remover ${project.projectName || "projeto"}`} onClick={() => onRemoveProject(project.id)}>
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </article>
        ))}
      </div>
      ) : null}
    </section>
  );
}
