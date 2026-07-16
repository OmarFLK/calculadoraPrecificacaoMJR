import { ChevronDown, ChevronUp, Download, Edit3, History, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";
import { downloadNegotiationPdf } from "../utils/negotiationPdf";

interface ProjectListProps {
  historyOpenRequest: string;
  projects: PricingProject[];
  selectedProjectId: string;
  onRemoveProject: (projectId: string) => void;
  onSelectProject: (projectId: string) => void;
}

export default function ProjectList({
  historyOpenRequest,
  projects,
  selectedProjectId,
  onRemoveProject,
  onSelectProject,
}: ProjectListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState("");
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const savedProjects = useMemo(
    () => projects.filter((project) => project.isHistorical),
    [projects],
  );
  const totalChargedValue = useMemo(
    () => savedProjects.reduce((total, project) => total + (project.chargedValue === "" ? 0 : project.chargedValue), 0),
    [savedProjects],
  );

  useEffect(() => {
    if (historyOpenRequest) {
      setIsOpen(true);
    }
  }, [historyOpenRequest]);

  const handlePdfDownload = async (project: PricingProject) => {
    setGeneratingPdfId(project.id);
    setPdfError("");
    try {
      await downloadNegotiationPdf(project);
    } catch {
      setPdfError("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setGeneratingPdfId(null);
    }
  };

  return (
    <section className="surface-card list-card" aria-labelledby="project-list-title">
      <div className="card-toolbar">
        <div className="history-heading">
          <div className="panel-icon">
            <History size={20} aria-hidden="true" />
          </div>
          <div>
            <p className="section-kicker">Histórico</p>
            <h2 id="project-list-title">Negociações e simulações</h2>
          </div>
        </div>

        <button
          className="primary-button history-toggle"
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
          <span>Negociações salvas</span>
          <strong>{savedProjects.length}</strong>
        </div>
        <div>
          <span>Projeto ativo</span>
          <strong>{selectedProject?.projectName || "Projeto sem nome"}</strong>
        </div>
        <div>
          <span>Valor negociado</span>
          <strong>{formatCurrency(totalChargedValue)}</strong>
        </div>
      </div>

      {pdfError ? <div className="history-error" role="alert">{pdfError}</div> : null}

      {isOpen ? (
      <div className="project-list" id="project-history-list">
        {projects.map((project) => (
          <article
            className={`project-item${project.id === selectedProjectId ? " active" : ""}${project.isHistorical ? "" : " draft"}`}
            key={project.id}
          >
            <div className="project-info">
              <div className="project-title-row">
                <h3>{project.projectName || "Projeto sem nome"}</h3>
                <span className={project.isHistorical ? "project-save-status saved" : "project-save-status"}>
                  {project.isHistorical ? "Salvo" : "Rascunho"}
                </span>
              </div>
              <p>{project.nucleus || "Núcleo não definido"} · {project.service || "Serviço não definido"}</p>
              <div className="project-tags">
                <span>{project.complexity || "Complexidade não definida"}</span>
                <span>{formatCurrency(project.chargedValue === "" ? 0 : project.chargedValue)}</span>
                {project.savedAt ? <span>{formatSavedDate(project.savedAt)}</span> : null}
              </div>
            </div>
            <div className="project-actions">
              {project.isHistorical ? (
                <button
                  className={generatingPdfId === project.id ? "pdf-download-button loading" : "pdf-download-button"}
                  type="button"
                  title="Baixar resumo em PDF"
                  disabled={generatingPdfId !== null}
                  onClick={() => void handlePdfDownload(project)}
                >
                  {generatingPdfId === project.id ? (
                    <LoaderCircle size={17} aria-hidden="true" />
                  ) : (
                    <Download size={17} aria-hidden="true" />
                  )}
                  {generatingPdfId === project.id ? "Gerando PDF" : "Baixar PDF"}
                </button>
              ) : null}
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

function formatSavedDate(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return "Data não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
