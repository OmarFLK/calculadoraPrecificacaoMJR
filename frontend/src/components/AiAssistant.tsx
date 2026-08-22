import { Bot, Loader2, Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  calculateDynamicCosts,
  calculateHistoricalSuggestion,
  calculateSuggestedPrice,
} from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";
import { calculateServiceMultiplier } from "../data/serviceMultipliers";
import { calculateArchitecturePricing } from "../logic/architecturePricing";
import type { MondayDemandSignal } from "./MondayDemandCard";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:5000";
const initialMessage =
  "Sou o Assistente IA de Precificação da Mauá Júnior. Posso ajudar a analisar escopo, riscos, complexidade e pontos de atenção para o preço.";
const friendlyErrorMessage = "Não foi possível consultar a IA no momento. Tente novamente.";

interface AiAssistantProps {
  accessToken: string;
  onUnauthorized: () => void;
  project: PricingProject;
  projects: PricingProject[];
  mondayDemandSignal?: MondayDemandSignal | null;
}

interface ChatMessage {
  author: "ai" | "user";
  content: string;
  label: string;
}

interface ConversationMessage {
  role: "assistant" | "user";
  content: string;
}

export default function AiAssistant({
  accessToken,
  onUnauthorized,
  project,
  projects,
  mondayDemandSignal,
}: AiAssistantProps) {
  const threadRef = useRef<HTMLDivElement | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { author: "ai", content: initialMessage, label: "IA" },
  ]);

  useEffect(() => {
    const thread = threadRef.current;

    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendPrompt = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt || isLoading) {
      return;
    }

    setPrompt("");
    setIsLoading(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      { author: "user", content: trimmedPrompt, label: "Você" },
    ]);

    const conversation = messages.slice(-6).map<ConversationMessage>((message) => ({
      role: message.author === "ai" ? "assistant" : "user",
      content: message.content,
    }));
    const answer = await fetchAiAnswer(
      trimmedPrompt,
      project,
      projects,
      conversation,
      mondayDemandSignal,
      accessToken,
      onUnauthorized,
    );

    setMessages((currentMessages) => [
      ...currentMessages,
      { author: "ai", content: answer, label: "Assistente" },
    ]);
    setIsLoading(false);
  };

  return (
    <section className="surface-card ai-card" aria-labelledby="ai-title">
      <div className="panel-heading">
        <div className="panel-icon">
          <Bot size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="section-kicker">OpenAI</p>
          <h2 id="ai-title">Assistente IA de Precificação</h2>
        </div>
      </div>

      <div className="assistant-thread" ref={threadRef} aria-live="polite">
        {messages.map((message, index) => (
          <div
            className={message.author === "ai" ? "assistant-bubble ai-bubble" : "assistant-bubble user-bubble"}
            key={`${message.author}-${index}`}
          >
            <span>{message.label}</span>
            <p>{message.content}</p>
          </div>
        ))}

        {isLoading ? (
          <div className="assistant-bubble ai-bubble loading-bubble">
            <span>Assistente</span>
            <p>
              <Loader2 size={15} aria-hidden="true" />
              Consultando IA...
            </p>
          </div>
        ) : null}
      </div>

      <form className="assistant-form" onSubmit={sendPrompt}>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Escreva uma pergunta ou detalhe do contexto..."
          rows={3}
        />
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          {isLoading ? "Enviando..." : "Enviar"}
        </button>
      </form>
    </section>
  );
}

async function fetchAiAnswer(
  message: string,
  project: PricingProject,
  projects: PricingProject[],
  conversation: ConversationMessage[],
  mondayDemandSignal: MondayDemandSignal | null | undefined,
  accessToken: string,
  onUnauthorized: () => void,
) {
  try {
    const response = await fetch(`${apiBaseUrl}/ai/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildChatPayload(message, project, projects, conversation, mondayDemandSignal)),
    });
    const payload = (await response.json()) as { success?: boolean; answer?: string; error?: string };

    if (response.status === 401) {
      onUnauthorized();
      return "Sua sessão expirou. Entre novamente para continuar.";
    }

    if (!response.ok || !payload.success || !payload.answer) {
      return payload.answer || payload.error || friendlyErrorMessage;
    }

    return payload.answer;
  } catch {
    return friendlyErrorMessage;
  }
}

function buildChatPayload(
  message: string,
  project: PricingProject,
  projects: PricingProject[],
  conversation: ConversationMessage[],
  mondayDemandSignal?: MondayDemandSignal | null,
) {
  const calculation = calculateSuggestedPrice(project);
  const architectureCalculation = calculateArchitecturePricing(project);
  const historicalSuggestion = calculateHistoricalSuggestion(project, projects);
  const serviceMultiplier = calculateServiceMultiplier(
    project.nucleus,
    project.service,
    project.serviceMultiplierValues,
  );

  return {
    message,
    projectContext: project.context,
    conversation,
    pricingData: {
      projectName: project.projectName,
      area: project.nucleus,
      nucleus: project.nucleus,
      service: project.service,
      complexity: project.complexity,
      totalWorkedHours: project.totalWorkedHours,
      averageHourValue: project.hourValue,
      desiredProfitMargin: project.desiredProfitMargin,
      taxes: project.taxes,
      costValues: project.costValues,
      additionalCosts: project.additionalCosts,
      dynamicCostsTotal: calculateDynamicCosts(project),
      suggestedPrice: calculation.precoFinal,
      complexityMultiplier: calculation.multiplicadorComplexidade,
      serviceMultiplier: calculation.multiplicadorServico,
      combinedMultiplier: calculation.multiplicador,
      serviceVariableSelections: serviceMultiplier.selections,
      serviceVariablesComplete: serviceMultiplier.answeredCount === serviceMultiplier.totalQuestions,
      serviceVariablesNeedReview: serviceMultiplier.reviewRequired,
      mondayDemandSignal,
      architecturePricing: project.architecturePricing,
      architectureCalculation,
      historicalSuggestion,
    },
  };
}
