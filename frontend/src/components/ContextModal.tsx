import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ContextModalProps {
  contextText: string;
  isOpen: boolean;
  projectName: string;
  onClose: () => void;
  onSave: (contextText: string) => void;
}

export default function ContextModal({
  contextText,
  isOpen,
  projectName,
  onClose,
  onSave,
}: ContextModalProps) {
  const [draftContext, setDraftContext] = useContextDraft(contextText, isOpen);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section
        className="context-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="context-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="section-kicker">Contexto do projeto</p>
            <h2 id="context-modal-title">{projectName || "Nova simulação"}</h2>
            <p>
              Registre escopo, entregáveis, premissas, riscos, materiais do Drive
              e observações úteis para a precificação.
            </p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <textarea
          autoFocus
          maxLength={3000}
          value={draftContext}
          onChange={(event) => setDraftContext(event.target.value)}
          placeholder="Descreva o contexto do projeto..."
        />

        <div className="modal-footer">
          <span>{draftContext.length} / 3000 caracteres</span>
          <button className="primary-button" type="button" onClick={() => onSave(draftContext)}>
            Salvar contexto
          </button>
        </div>
      </section>
    </div>
  );
}

function useContextDraft(contextText: string, isOpen: boolean) {
  const [draftContext, setDraftContext] = useState(contextText);

  useEffect(() => {
    if (isOpen) {
      setDraftContext(contextText);
    }
  }, [contextText, isOpen]);

  return [draftContext, setDraftContext] as const;
}
