import { Activity, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Nucleus } from "../types/pricing";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5000";

export interface MondayDemandSignal {
  level: "baixa" | "media" | "alta";
  adjustmentPercentage: number;
  activeItems: number;
  consideredItems: number;
  boardName: string;
  area: string;
}

interface MondayDemandCardProps {
  area: Nucleus | "";
  onSignalChange: (signal: MondayDemandSignal | null) => void;
}

export default function MondayDemandCard({ area, onSignalChange }: MondayDemandCardProps) {
  const [signal, setSignal] = useState<MondayDemandSignal | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unconfigured" | "error">("loading");

  const loadSignal = useCallback(async (refresh = false) => {
    setState("loading");
    try {
      const params = new URLSearchParams();
      if (area) params.set("area", area);
      if (refresh) params.set("refresh", "true");
      const response = await fetch(`${apiBaseUrl}/integrations/monday/pricing-context?${params}`);
      const payload = (await response.json()) as {
        configured?: boolean;
        signal?: MondayDemandSignal;
      };
      if (!response.ok) throw new Error("monday request failed");
      if (!payload.configured || !payload.signal) {
        setSignal(null);
        onSignalChange(null);
        setState("unconfigured");
        return;
      }
      setSignal(payload.signal);
      onSignalChange(payload.signal);
      setState("ready");
    } catch {
      setSignal(null);
      onSignalChange(null);
      setState("error");
    }
  }, [area, onSignalChange]);

  useEffect(() => {
    void loadSignal();
  }, [loadSignal]);

  const levelLabel = signal?.level === "alta" ? "Alta" : signal?.level === "media" ? "Média" : "Baixa";

  return (
    <section className="surface-card monday-card" aria-labelledby="monday-demand-title">
      <div className="monday-card-copy">
        <span className="panel-icon monday-icon"><Activity size={19} aria-hidden="true" /></span>
        <div>
          <p className="section-kicker">monday.com · sinal operacional</p>
          <h2 id="monday-demand-title">Demanda comercial</h2>
          {state === "loading" ? <p>Atualizando contexto do pipeline...</p> : null}
          {state === "unconfigured" ? <p>Integração pronta. Configure o board no backend para ativar.</p> : null}
          {state === "error" ? <p>Não foi possível consultar o board agora.</p> : null}
          {state === "ready" && signal ? (
            <p>{signal.activeItems} item(ns) ativo(s) em {signal.consideredItems} oportunidade(s) consideradas.</p>
          ) : null}
        </div>
      </div>
      {state === "ready" && signal ? (
        <div className={`demand-badge ${signal.level}`}>
          <span>Demanda {levelLabel}</span>
          <strong>+{signal.adjustmentPercentage}%</strong>
          <small>referência, não aplicada automaticamente</small>
        </div>
      ) : null}
      <button className="secondary-icon-button" type="button" onClick={() => void loadSignal(true)} title="Atualizar monday.com">
        <RefreshCcw size={17} aria-hidden="true" />
      </button>
    </section>
  );
}
