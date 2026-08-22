import { Ruler, Sheet } from "lucide-react";
import { getArchitectureSquareMeterRate } from "../logic/architecturePricing";
import { formatCurrency } from "../logic/pricingCalculations";
import type {
  ArchitecturePricingInputs,
  CostFieldValue,
  PricingProject,
} from "../types/pricing";

interface ArchitecturePricingFieldsProps {
  project: PricingProject;
  onUpdateProject: (projectId: string, changes: Partial<PricingProject>) => void;
}

export default function ArchitecturePricingFields({
  project,
  onUpdateProject,
}: ArchitecturePricingFieldsProps) {
  const inputs = project.architecturePricing;
  const totalSquareMeters = inputs.sheetAreas.reduce<number>(
    (total, area) => total + (area === "" ? 0 : area),
    0,
  );
  const squareMeterRate = getArchitectureSquareMeterRate(project.service, inputs.finishLevel);

  const updateArchitecture = (changes: Partial<ArchitecturePricingInputs>) => {
    onUpdateProject(project.id, {
      architecturePricing: { ...inputs, ...changes },
    });
  };

  const updateProjectNumber = (
    field: "consultantsCount" | "hourValue" | "taxes",
    rawValue: string,
  ) => {
    onUpdateProject(project.id, { [field]: parseNumber(rawValue) });
  };

  const updateSheetCount = (rawValue: string) => {
    const requestedCount = rawValue === "" ? 0 : Math.min(50, Math.max(0, Math.floor(Number(rawValue))));
    const sheetAreas = Array.from({ length: requestedCount }, (_, index): CostFieldValue =>
      inputs.sheetAreas[index] ?? "",
    );
    updateArchitecture({ sheetAreas });
  };

  const updateSheetArea = (index: number, rawValue: string) => {
    const sheetAreas = [...inputs.sheetAreas];
    sheetAreas[index] = parseNumber(rawValue);
    updateArchitecture({ sheetAreas });
  };

  return (
    <section className="architecture-pricing-section" aria-labelledby="architecture-pricing-title">
      <div className="architecture-pricing-heading">
        <span className="panel-icon compact"><Ruler size={17} aria-hidden="true" /></span>
        <div>
          <p className="section-kicker">Planilha de referência</p>
          <h3 id="architecture-pricing-title">Parâmetros de Arquitetura e Civil</h3>
        </div>
      </div>

      <div className="form-grid three-columns">
        <NumberInput
          label="Número de folhas / plantas"
          value={inputs.sheetAreas.length || ""}
          onChange={updateSheetCount}
          step="1"
        />
        <label className="field">
          <span>Nível de acabamento / dificuldade</span>
          <select
            disabled={!project.service}
            value={inputs.finishLevel}
            onChange={(event) => updateArchitecture({
              finishLevel: event.target.value === "" ? "" : Number(event.target.value) as 1 | 2 | 3,
            })}
          >
            <option value="">{project.service ? "Selecione" : "Selecione o serviço primeiro"}</option>
            {project.service ? [1, 2, 3].map((level) => (
              <option key={level} value={level}>
                Nível {level} · {formatCurrency(getArchitectureSquareMeterRate(project.service, level as 1 | 2 | 3))}/m²
              </option>
            )) : null}
          </select>
        </label>
        <ReadOnlyValue label="Valor por m²" value={squareMeterRate ? formatCurrency(squareMeterRate) : "Selecione o nível"} />
      </div>

      {inputs.sheetAreas.length ? (
        <div className="architecture-sheet-areas">
          <div className="architecture-sheet-title">
            <Sheet size={17} aria-hidden="true" />
            <span>Área de cada folha / planta</span>
          </div>
          <div className="architecture-sheet-grid">
            {inputs.sheetAreas.map((area, index) => (
              <NumberInput
                key={index}
                label={`Folha ${index + 1}`}
                value={area}
                onChange={(value) => updateSheetArea(index, value)}
                suffix="m²"
              />
            ))}
          </div>
          <div className="architecture-total-area">
            <span>Área total</span>
            <strong>{totalSquareMeters.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} m²</strong>
          </div>
        </div>
      ) : null}

      <div className="form-grid three-columns">
        <NumberInput
          label="Número de consultores"
          value={project.consultantsCount}
          onChange={(value) => updateProjectNumber("consultantsCount", value)}
          step="1"
        />
        <NumberInput
          label="Valor da hora / consultor"
          value={project.hourValue}
          onChange={(value) => updateProjectNumber("hourValue", value)}
          prefix="R$"
        />
        <NumberInput
          label="Horas de trabalho / consultor"
          value={inputs.workHoursPerConsultant}
          onChange={(value) => updateArchitecture({ workHoursPerConsultant: parseNumber(value) })}
          suffix="h"
        />
      </div>

      <div className="form-grid three-columns">
        <NumberInput
          label="ART — professores"
          value={inputs.professorArtCost}
          onChange={(value) => updateArchitecture({ professorArtCost: parseNumber(value) })}
          prefix="R$"
        />
        <NumberInput
          label="Emissão de ART"
          value={inputs.artIssuanceCost}
          onChange={(value) => updateArchitecture({ artIssuanceCost: parseNumber(value) })}
          prefix="R$"
        />
        <NumberInput
          label="Taxa de imposto"
          value={project.taxes}
          onChange={(value) => updateProjectNumber("taxes", value)}
          suffix="%"
        />
      </div>
    </section>
  );
}

function NumberInput({
  label,
  onChange,
  prefix,
  step = "0.01",
  suffix,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  prefix?: string;
  step?: string;
  suffix?: string;
  value: number | "";
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className={prefix ? "input-with-prefix" : "input-with-suffix"}>
        {prefix ? <strong>{prefix}</strong> : null}
        <input
          min="0"
          step={step}
          type="number"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {suffix ? <strong>{suffix}</strong> : null}
      </div>
    </label>
  );
}

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="readonly-input" readOnly value={value} />
    </label>
  );
}

const parseNumber = (rawValue: string): CostFieldValue => rawValue === "" ? "" : Number(rawValue);
