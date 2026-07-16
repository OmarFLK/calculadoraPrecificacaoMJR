import { Plus, RotateCcw, Save } from "lucide-react";
import type { PricingProject } from "../types/pricing";
import PricingRow from "./PricingRow";

interface PricingTableProps {
  projects: PricingProject[];
  selectedProjectId: string;
  saveMessage: string;
  onAddRow: () => void;
  onClearRows: () => void;
  onOpenContext: (projectId: string) => void;
  onRemoveRow: (projectId: string) => void;
  onSave: () => void;
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (projectId: string, changes: Partial<PricingProject>) => void;
}

const tableHeaders = [
  "",
  "Núcleo",
  "Serviço",
  "Nome do projeto",
  "Valor cobrado",
  "Ticket médio / referência",
  "Tempo de execução",
  "Unidade do tempo",
  "Horas totais trabalhadas",
  "Qtd. consultores",
  "Média horas / consultor / semana",
  "Valor médio da hora",
  "Margem lucro desejada",
  "Impostos",
  "Custos extras",
  "Complexidade",
  "Multiplicador",
  "Contexto",
  "Link do Drive",
  "Ações",
];

export default function PricingTable({
  projects,
  selectedProjectId,
  saveMessage,
  onAddRow,
  onClearRows,
  onOpenContext,
  onRemoveRow,
  onSave,
  onSelectProject,
  onUpdateProject,
}: PricingTableProps) {
  return (
    <section className="surface-card pricing-card" aria-labelledby="pricing-title">
      <div className="card-toolbar">
        <div>
          <p className="section-kicker">Planilha editável</p>
          <h2 id="pricing-title">Projetos históricos e simulações</h2>
          <p>
            Arquivos pesados serão armazenados futuramente no Drive; o sistema
            salvará apenas o link.
          </p>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button" type="button" onClick={onClearRows}>
            <RotateCcw size={16} aria-hidden="true" />
            Limpar
          </button>
          <button className="secondary-button" type="button" onClick={onAddRow}>
            <Plus size={16} aria-hidden="true" />
            Adicionar linha
          </button>
          <button className="primary-button" type="button" onClick={onSave}>
            <Save size={16} aria-hidden="true" />
            Salvar negociação
          </button>
        </div>
      </div>

      {saveMessage ? <div className="success-message">{saveMessage}</div> : null}

      <div className="sheet-scroll" aria-label="Tabela editável de projetos históricos">
        <table className="pricing-sheet">
          <thead>
            <tr>
              {tableHeaders.map((header) => (
                <th key={header || "selected"}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <PricingRow
                key={project.id}
                project={project}
                isSelected={project.id === selectedProjectId}
                onOpenContext={onOpenContext}
                onRemove={onRemoveRow}
                onSelect={onSelectProject}
                onUpdate={onUpdateProject}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
