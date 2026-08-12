import { ChevronDown, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  calculateServiceMultiplier,
  getServiceMultiplierQuestions,
} from "../data/serviceMultipliers";
import type { Nucleus } from "../types/pricing";

interface ServiceMultiplierFieldsProps {
  nucleus: Nucleus | "";
  service: string;
  values: Record<string, string>;
  onChange: (questionId: string, value: string) => void;
}

export default function ServiceMultiplierFields({
  nucleus,
  service,
  values,
  onChange,
}: ServiceMultiplierFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const questions = getServiceMultiplierQuestions(nucleus, service);
  const summary = calculateServiceMultiplier(nucleus, service, values);

  if (!questions.length) {
    return null;
  }

  return (
    <section className="multiplier-section" aria-labelledby="service-multiplier-title">
      <button
        className="dynamic-cost-heading"
        type="button"
        aria-controls="service-multiplier-fields"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <div className="multiplier-heading-copy">
          <span className="panel-icon compact"><SlidersHorizontal size={17} aria-hidden="true" /></span>
          <div>
            <p className="section-kicker">Regras do manual</p>
            <h3 id="service-multiplier-title">Variáveis específicas do serviço</h3>
          </div>
        </div>
        <div className="multiplier-heading-summary">
          <span>{summary.answeredCount}/{summary.totalQuestions} preenchidas</span>
          <strong>× {summary.multiplier.toFixed(2)}</strong>
          <ChevronDown size={19} aria-hidden="true" />
        </div>
      </button>

      {isExpanded ? (
        <div className="multiplier-grid" id="service-multiplier-fields" key={`${nucleus}-${service}`}>
          {questions.map((question) => (
            <label className="field multiplier-field" key={question.id}>
              <span>{question.label}</span>
              <select
                value={values[question.id] ?? ""}
                onChange={(event) => onChange(question.id, event.target.value)}
              >
                <option value="">Selecione</option>
                {question.options.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label} {choice.multiplier === null ? "· pendente" : `· ×${choice.multiplier.toFixed(2)}`}
                  </option>
                ))}
              </select>
              {question.help ? <small>{question.help}</small> : null}
            </label>
          ))}
          {summary.reviewRequired ? (
            <div className="multiplier-review-warning" role="status">
              <TriangleAlert size={17} aria-hidden="true" />
              Há uma faixa sem multiplicador no manual. Confirme o valor com o núcleo antes de fechar.
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
