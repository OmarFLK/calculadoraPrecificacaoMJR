import { ChevronDown, CirclePlus, Trash2 } from "lucide-react";
import { useState } from "react";
import { getCostFieldsForArea } from "../data/costFields";
import type {
  AdditionalCost,
  CostFieldValue,
  Nucleus,
} from "../types/pricing";

interface DynamicCostFieldsProps {
  area: Nucleus | "";
  values: Record<string, CostFieldValue>;
  additionalCosts: AdditionalCost[];
  onChangeValue: (fieldId: string, value: CostFieldValue) => void;
  onChangeAdditionalCosts: (costs: AdditionalCost[]) => void;
}

export default function DynamicCostFields({
  area,
  values,
  additionalCosts,
  onChangeValue,
  onChangeAdditionalCosts,
}: DynamicCostFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const fields = getCostFieldsForArea(area);

  const addCostLine = () => {
    onChangeAdditionalCosts([
      ...additionalCosts,
      { id: crypto.randomUUID(), description: "", amount: "" },
    ]);
  };

  const updateCostLine = (id: string, changes: Partial<AdditionalCost>) => {
    onChangeAdditionalCosts(
      additionalCosts.map((cost) => (cost.id === id ? { ...cost, ...changes } : cost)),
    );
  };

  const removeCostLine = (id: string) => {
    onChangeAdditionalCosts(additionalCosts.filter((cost) => cost.id !== id));
  };

  return (
    <section className="dynamic-cost-section" aria-labelledby="dynamic-cost-title">
      <button
        className="dynamic-cost-heading"
        type="button"
        aria-controls="dynamic-cost-fields"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
      >
        <div>
          <p className="section-kicker">Composição de custo</p>
          <h3 id="dynamic-cost-title">Custos do projeto</h3>
        </div>
        <ChevronDown size={19} aria-hidden="true" />
      </button>

      {isExpanded ? <div className="dynamic-cost-grid" id="dynamic-cost-fields" key={area || "sem-area"}>
        {fields.map((field) =>
          field.type === "free-list" ? (
            <AdditionalCostsEditor
              key={field.id}
              label={field.label}
              costs={additionalCosts}
              onAdd={addCostLine}
              onRemove={removeCostLine}
              onUpdate={updateCostLine}
            />
          ) : (
            <label className="field cost-field" key={field.id}>
              <span>
                {field.label}
                {field.required ? <small aria-label="obrigatório">*</small> : null}
              </span>
              <div className="input-with-prefix">
                {field.type === "currency" ? <strong>R$</strong> : null}
                <input
                  min="0"
                  step="0.01"
                  type={field.type === "text" ? "text" : "number"}
                  required={field.required}
                  value={values[field.id] ?? ""}
                  onChange={(event) =>
                    onChangeValue(
                      field.id,
                      event.target.value === "" ? "" : Number(event.target.value),
                    )
                  }
                />
              </div>
            </label>
          ),
        )}
      </div> : null}
    </section>
  );
}

interface AdditionalCostsEditorProps {
  label: string;
  costs: AdditionalCost[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, changes: Partial<AdditionalCost>) => void;
}

function AdditionalCostsEditor({
  label,
  costs,
  onAdd,
  onRemove,
  onUpdate,
}: AdditionalCostsEditorProps) {
  return (
    <div className="additional-costs-editor">
      <div className="additional-costs-toolbar">
        <span>{label}</span>
        <button
          className="secondary-icon-button"
          type="button"
          title="Adicionar custo"
          aria-label="Adicionar custo"
          onClick={onAdd}
        >
          <CirclePlus size={18} aria-hidden="true" />
        </button>
      </div>

      {costs.length ? (
        <div className="additional-cost-list">
          {costs.map((cost) => (
            <div className="additional-cost-row" key={cost.id}>
              <input
                aria-label="Descrição do custo"
                value={cost.description}
                placeholder="Descrição"
                onChange={(event) => onUpdate(cost.id, { description: event.target.value })}
              />
              <div className="input-with-prefix">
                <strong>R$</strong>
                <input
                  aria-label="Valor do custo"
                  min="0"
                  step="0.01"
                  type="number"
                  value={cost.amount}
                  onChange={(event) =>
                    onUpdate(cost.id, {
                      amount: event.target.value === "" ? "" : Number(event.target.value),
                    })
                  }
                />
              </div>
              <button
                className="danger-icon-button"
                type="button"
                title="Remover custo"
                aria-label={`Remover ${cost.description || "custo"}`}
                onClick={() => onRemove(cost.id)}
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button className="add-cost-empty" type="button" onClick={onAdd}>
          <CirclePlus size={17} aria-hidden="true" />
          Adicionar custo
        </button>
      )}
    </div>
  );
}
