import { FileText, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import DynamicCostFields from "./DynamicCostFields";
import { getUniversalCostValueIds } from "../data/costFields";
import { COMPLEXITY_MULTIPLIERS, NUCLEUS_SERVICES, TIME_UNITS } from "../data/services";
import type {
  AdditionalCost,
  Complexity,
  CostFieldValue,
  Nucleus,
  PricingProject,
} from "../types/pricing";

interface PricingFormProps {
  project: PricingProject;
  saveMessage: string;
  onAddProject: () => void;
  onClearProjects: () => void;
  onOpenContext: (projectId: string) => void;
  onRemoveProject: (projectId: string) => void;
  onSave: () => void;
  onUpdateProject: (projectId: string, changes: Partial<PricingProject>) => void;
}

type NumericField =
  | "chargedValue"
  | "referenceTicket"
  | "executionTime"
  | "totalWorkedHours"
  | "consultantsCount"
  | "weeklyHoursAverage"
  | "hourValue"
  | "desiredProfitMargin"
  | "taxes";

export default function PricingForm({
  project,
  saveMessage,
  onAddProject,
  onClearProjects,
  onOpenContext,
  onRemoveProject,
  onSave,
  onUpdateProject,
}: PricingFormProps) {
  const services = project.nucleus ? NUCLEUS_SERVICES[project.nucleus] : [];

  const updateNumber = (fieldName: NumericField, rawValue: string) => {
    onUpdateProject(project.id, { [fieldName]: rawValue === "" ? "" : Number(rawValue) });
  };

  const updateNucleus = (nucleus: Nucleus | "") => {
    const universalCostIds = getUniversalCostValueIds();
    const costValues = Object.fromEntries(
      Object.entries(project.costValues).filter(([fieldId]) => universalCostIds.has(fieldId)),
    );

    onUpdateProject(project.id, { nucleus, service: "", costValues });
  };

  const updateCostValue = (fieldId: string, value: CostFieldValue) => {
    onUpdateProject(project.id, {
      costValues: { ...project.costValues, [fieldId]: value },
    });
  };

  const updateAdditionalCosts = (additionalCosts: AdditionalCost[]) => {
    const extraCosts = additionalCosts.reduce(
      (total, cost) => total + (cost.amount === "" ? 0 : cost.amount),
      0,
    );
    onUpdateProject(project.id, { additionalCosts, extraCosts });
  };

  const updateComplexity = (complexity: Complexity | "") => {
    onUpdateProject(project.id, {
      complexity,
      complexityMultiplier: complexity ? COMPLEXITY_MULTIPLIERS[complexity] : "",
    });
  };

  return (
    <section className="surface-card form-card" aria-labelledby="pricing-form-title">
      <div className="card-toolbar">
        <div>
          <p className="section-kicker">Cadastro e simulação</p>
          <h2 id="pricing-form-title">Precificação do projeto</h2>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button" type="button" onClick={onAddProject}>
            <Plus size={16} aria-hidden="true" />
            Novo
          </button>
          <button className="secondary-button" type="button" onClick={onClearProjects}>
            <RotateCcw size={16} aria-hidden="true" />
            Limpar
          </button>
          <button className="primary-button" type="button" onClick={onSave}>
            <Save size={16} aria-hidden="true" />
            Simular salvar
          </button>
        </div>
      </div>

      {saveMessage ? <div className="success-message">{saveMessage}</div> : null}

      <div className="form-section">
        <div className="form-grid two-columns">
          <SelectField
            label="Núcleo"
            value={project.nucleus}
            onChange={(value) => updateNucleus(value as Nucleus | "")}
            options={Object.keys(NUCLEUS_SERVICES)}
            placeholder="Selecione"
          />
          <SelectField
            label="Serviço"
            value={project.service}
            onChange={(value) => onUpdateProject(project.id, { service: value })}
            options={services}
            placeholder={project.nucleus ? "Selecione" : "Selecione o núcleo"}
          />
        </div>

        <TextField
          label="Nome do projeto"
          value={project.projectName}
          onChange={(value) => onUpdateProject(project.id, { projectName: value })}
          placeholder="Ex: Sistema interno de indicadores"
        />

        <div className="form-grid two-columns">
          <NumberField
            label="Valor cobrado"
            value={project.chargedValue}
            onChange={(value) => updateNumber("chargedValue", value)}
            placeholder="R$"
          />
          <NumberField
            label="Ticket médio / referência"
            value={project.referenceTicket}
            onChange={(value) => updateNumber("referenceTicket", value)}
            placeholder="R$"
          />
        </div>

        <DynamicCostFields
          area={project.nucleus}
          values={project.costValues}
          additionalCosts={project.additionalCosts}
          onChangeValue={updateCostValue}
          onChangeAdditionalCosts={updateAdditionalCosts}
        />

        <div className="form-grid three-columns">
          <NumberField
            label="Tempo de execução"
            value={project.executionTime}
            onChange={(value) => updateNumber("executionTime", value)}
            placeholder="Ex: 8"
          />
          <SelectField
            label="Unidade do tempo"
            value={project.timeUnit}
            onChange={(value) => onUpdateProject(project.id, { timeUnit: value as PricingProject["timeUnit"] })}
            options={TIME_UNITS}
          />
          <NumberField
            label="Horas totais trabalhadas"
            value={project.totalWorkedHours}
            onChange={(value) => updateNumber("totalWorkedHours", value)}
            placeholder="Ex: 180"
          />
        </div>

        <div className="form-grid three-columns">
          <NumberField
            label="Quantidade de consultores"
            value={project.consultantsCount}
            onChange={(value) => updateNumber("consultantsCount", value)}
            placeholder="Ex: 4"
          />
          <NumberField
            label="Média horas / consultor / semana"
            value={project.weeklyHoursAverage}
            onChange={(value) => updateNumber("weeklyHoursAverage", value)}
            placeholder="Ex: 12"
          />
          <NumberField
            label="Valor médio da hora"
            value={project.hourValue}
            onChange={(value) => updateNumber("hourValue", value)}
            placeholder="Ex: 60"
          />
        </div>

        <div className="form-grid three-columns">
          <NumberField
            label="Margem de lucro desejada"
            value={project.desiredProfitMargin}
            onChange={(value) => updateNumber("desiredProfitMargin", value)}
            placeholder="Ex: 25"
            suffix="%"
          />
          <NumberField
            label="Impostos"
            value={project.taxes}
            onChange={(value) => updateNumber("taxes", value)}
            placeholder="Ex: 13.5"
            suffix="%"
          />
          <SelectField
            label="Complexidade"
            value={project.complexity}
            onChange={(value) => updateComplexity(value as Complexity | "")}
            options={Object.keys(COMPLEXITY_MULTIPLIERS)}
            placeholder="Selecione"
          />
        </div>

        <div className="form-grid two-columns">
          <TextField
            label="Multiplicador de complexidade"
            value={String(project.complexityMultiplier)}
            onChange={() => undefined}
            placeholder="Auto"
            readOnly
          />
          <TextField
            label="Link do Drive"
            value={project.driveLink}
            onChange={(value) => onUpdateProject(project.id, { driveLink: value })}
            placeholder="https://drive.google.com/..."
          />
        </div>

        <p className="drive-help">
          Arquivos pesados serão armazenados futuramente no Drive; o sistema salvará apenas o link.
        </p>

        <div className="form-actions-row">
          <button
            className={project.context.trim() ? "context-button complete" : "context-button"}
            type="button"
            onClick={() => onOpenContext(project.id)}
          >
            <FileText size={16} aria-hidden="true" />
            {project.context.trim() ? "Contexto preenchido" : "Contexto"}
          </button>
          <button className="danger-button" type="button" onClick={() => onRemoveProject(project.id)}>
            <Trash2 size={16} aria-hidden="true" />
            Remover projeto
          </button>
        </div>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        readOnly={readOnly}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: number | "";
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-with-suffix">
        <input
          min="0"
          step="0.01"
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
        {suffix ? <strong>{suffix}</strong> : null}
      </div>
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
