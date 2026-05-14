import { CheckCircle2, FileText, Trash2 } from "lucide-react";
import { COMPLEXITY_MULTIPLIERS, NUCLEUS_SERVICES, TIME_UNITS } from "../data/services";
import type { Complexity, Nucleus, PricingProject } from "../types/pricing";

interface PricingRowProps {
  project: PricingProject;
  isSelected: boolean;
  onOpenContext: (projectId: string) => void;
  onRemove: (projectId: string) => void;
  onSelect: (projectId: string) => void;
  onUpdate: (projectId: string, changes: Partial<PricingProject>) => void;
}

const numericFields = [
  "chargedValue",
  "referenceTicket",
  "executionTime",
  "totalWorkedHours",
  "consultantsCount",
  "weeklyHoursAverage",
  "hourValue",
  "desiredProfitMargin",
  "taxes",
  "extraCosts",
] as const;

type NumericField = (typeof numericFields)[number];

export default function PricingRow({
  project,
  isSelected,
  onOpenContext,
  onRemove,
  onSelect,
  onUpdate,
}: PricingRowProps) {
  const serviceOptions = project.nucleus ? NUCLEUS_SERVICES[project.nucleus] : [];

  const updateNumber = (fieldName: NumericField, rawValue: string) => {
    onUpdate(project.id, { [fieldName]: parseNumberInput(rawValue) });
  };

  const updateComplexity = (complexity: Complexity | "") => {
    onUpdate(project.id, {
      complexity,
      complexityMultiplier: complexity ? COMPLEXITY_MULTIPLIERS[complexity] : "",
    });
  };

  const updateNucleus = (nucleus: Nucleus | "") => {
    onUpdate(project.id, { nucleus, service: "" });
  };

  return (
    <tr className={isSelected ? "selected-row" : ""}>
      <td className="selection-cell">
        <button
          className={isSelected ? "row-select active" : "row-select"}
          type="button"
          onClick={() => onSelect(project.id)}
          aria-label={`Selecionar ${project.projectName || "linha"}`}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
        </button>
      </td>
      <td>
        <select value={project.nucleus} onChange={(event) => updateNucleus(event.target.value as Nucleus | "")}>
          <option value="">Selecione</option>
          {Object.keys(NUCLEUS_SERVICES).map((nucleus) => (
            <option key={nucleus} value={nucleus}>
              {nucleus}
            </option>
          ))}
        </select>
      </td>
      <td className="service-cell">
        <select
          value={project.service}
          onChange={(event) => onUpdate(project.id, { service: event.target.value })}
        >
          <option value="">{project.nucleus ? "Selecione" : "Selecione o núcleo"}</option>
          {serviceOptions.map((service) => (
            <option key={service} value={service}>
              {service}
            </option>
          ))}
        </select>
      </td>
      <td className="project-name-cell">
        <input
          value={project.projectName}
          onChange={(event) => onUpdate(project.id, { projectName: event.target.value })}
          placeholder="Nome do projeto"
        />
      </td>
      <NumberCell fieldName="chargedValue" project={project} onChange={updateNumber} />
      <NumberCell fieldName="referenceTicket" project={project} onChange={updateNumber} />
      <NumberCell fieldName="executionTime" project={project} onChange={updateNumber} />
      <td>
        <select
          value={project.timeUnit}
          onChange={(event) => onUpdate(project.id, { timeUnit: event.target.value as PricingProject["timeUnit"] })}
        >
          {TIME_UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </td>
      <NumberCell fieldName="totalWorkedHours" project={project} onChange={updateNumber} />
      <NumberCell fieldName="consultantsCount" project={project} onChange={updateNumber} />
      <NumberCell fieldName="weeklyHoursAverage" project={project} onChange={updateNumber} />
      <NumberCell fieldName="hourValue" project={project} onChange={updateNumber} />
      <NumberCell fieldName="desiredProfitMargin" project={project} onChange={updateNumber} />
      <NumberCell fieldName="taxes" project={project} onChange={updateNumber} />
      <NumberCell fieldName="extraCosts" project={project} onChange={updateNumber} />
      <td>
        <select value={project.complexity} onChange={(event) => updateComplexity(event.target.value as Complexity | "")}>
          <option value="">Selecione</option>
          {Object.keys(COMPLEXITY_MULTIPLIERS).map((complexity) => (
            <option key={complexity} value={complexity}>
              {complexity}
            </option>
          ))}
        </select>
      </td>
      <td className="number-cell">
        <input className="readonly-input" readOnly value={project.complexityMultiplier} placeholder="Auto" />
      </td>
      <td>
        <button
          className={project.context.trim() ? "context-button complete" : "context-button"}
          type="button"
          onClick={() => onOpenContext(project.id)}
        >
          <FileText size={15} aria-hidden="true" />
          Contexto
        </button>
      </td>
      <td className="drive-cell">
        <input
          value={project.driveLink}
          onChange={(event) => onUpdate(project.id, { driveLink: event.target.value })}
          placeholder="Link do Drive"
          type="url"
        />
      </td>
      <td>
        <button className="danger-icon-button" type="button" onClick={() => onRemove(project.id)} aria-label="Remover">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

interface NumberCellProps {
  fieldName: NumericField;
  project: PricingProject;
  onChange: (fieldName: NumericField, rawValue: string) => void;
}

function NumberCell({ fieldName, project, onChange }: NumberCellProps) {
  return (
    <td className="number-cell">
      <input
        min="0"
        step={fieldName === "executionTime" || fieldName === "consultantsCount" ? "1" : "0.01"}
        type="number"
        value={project[fieldName]}
        onChange={(event) => onChange(fieldName, event.target.value)}
        placeholder={getNumberPlaceholder(fieldName)}
      />
    </td>
  );
}

function parseNumberInput(rawValue: string) {
  return rawValue === "" ? "" : Number(rawValue);
}

function getNumberPlaceholder(fieldName: NumericField) {
  const placeholders: Record<NumericField, string> = {
    chargedValue: "R$",
    referenceTicket: "Referência",
    executionTime: "Ex: 8",
    totalWorkedHours: "Ex: 180",
    consultantsCount: "Ex: 4",
    weeklyHoursAverage: "Ex: 12",
    hourValue: "Ex: 60",
    desiredProfitMargin: "Ex: 25",
    taxes: "Ex: 13.5",
    extraCosts: "R$",
  };

  return placeholders[fieldName];
}
