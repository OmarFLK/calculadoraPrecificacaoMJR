import { useEffect, useMemo, useRef, useState } from "react";
import AiAssistant from "./components/AiAssistant";
import ChartsPreview from "./components/ChartsPreview";
import ContextModal from "./components/ContextModal";
import DashboardSummary from "./components/DashboardSummary";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import PricingForm from "./components/PricingForm";
import ProjectList from "./components/ProjectList";
import ResultCard from "./components/ResultCard";
import { createEmptyPricingProject, SAMPLE_HISTORICAL_PROJECTS } from "./data/services";
import type { PricingProject } from "./types/pricing";

const createProjectId = () => crypto.randomUUID();

export default function App() {
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const pricingFormRef = useRef<HTMLDivElement | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem("maua-pricing-authenticated") === "true",
  );
  const [projects, setProjects] = useState<PricingProject[]>(SAMPLE_HISTORICAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState(SAMPLE_HISTORICAL_PROJECTS[0].id);
  const [activeContextProjectId, setActiveContextProjectId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  );
  const activeProject = selectedProject ?? projects[0];

  const activeContextProject = useMemo(
    () => projects.find((project) => project.id === activeContextProjectId),
    [projects, activeContextProjectId],
  );

  useEffect(() => {
    const pricingFormElement = pricingFormRef.current;
    const workbenchElement = workbenchRef.current;

    if (!pricingFormElement || !workbenchElement) {
      return undefined;
    }

    const syncAssistantHeight = () => {
      const formHeight = pricingFormElement.getBoundingClientRect().height;
      workbenchElement.style.setProperty("--assistant-card-height", `${Math.round(formHeight)}px`);
    };

    syncAssistantHeight();

    const observer = new ResizeObserver(syncAssistantHeight);
    observer.observe(pricingFormElement);
    window.addEventListener("resize", syncAssistantHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncAssistantHeight);
    };
  }, [activeProject, saveMessage]);

  const addProjectRow = () => {
    const newProject = createEmptyPricingProject(createProjectId());
    setProjects((currentProjects) => [...currentProjects, newProject]);
    setSelectedProjectId(newProject.id);
  };

  const clearProjects = () => {
    const emptyProject = createEmptyPricingProject(createProjectId());
    setProjects([emptyProject]);
    setSelectedProjectId(emptyProject.id);
    setSaveMessage("");
  };

  const removeProjectRow = (projectId: string) => {
    setProjects((currentProjects) => {
      const nextProjects = currentProjects.filter((project) => project.id !== projectId);
      const safeProjects = nextProjects.length ? nextProjects : [createEmptyPricingProject(createProjectId())];

      if (!safeProjects.some((project) => project.id === selectedProjectId)) {
        setSelectedProjectId(safeProjects[0].id);
      }

      return safeProjects;
    });
  };

  const updateProject = (projectId: string, changes: Partial<PricingProject>) => {
    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === projectId ? { ...project, ...changes } : project,
      ),
    );
  };

  const saveContext = (contextText: string) => {
    if (activeContextProjectId) {
      updateProject(activeContextProjectId, { context: contextText });
    }

    setActiveContextProjectId(null);
  };

  const simulateSave = () => {
    setSaveMessage("Dados simulados salvos com sucesso. Integrações reais entram em uma etapa futura.");
    window.setTimeout(() => setSaveMessage(""), 3500);
  };

  const login = () => {
    window.sessionStorage.setItem("maua-pricing-authenticated", "true");
    setIsAuthenticated(true);
  };

  const logout = () => {
    window.sessionStorage.removeItem("maua-pricing-authenticated");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <>
      <Header onLogout={logout} />

      <main className="app-shell page-stack">
        <div className="workbench-grid" ref={workbenchRef}>
          <div className="pricing-form-anchor" ref={pricingFormRef}>
            <PricingForm
              project={activeProject}
              saveMessage={saveMessage}
              onAddProject={addProjectRow}
              onClearProjects={clearProjects}
              onOpenContext={setActiveContextProjectId}
              onRemoveProject={removeProjectRow}
              onSave={simulateSave}
              onUpdateProject={updateProject}
            />
          </div>

          <aside className="assistant-column">
            <AiAssistant project={activeProject} projects={projects} />
          </aside>
        </div>

        <ResultCard project={activeProject} projects={projects} />
        <DashboardSummary projects={projects} selectedProject={activeProject} />
        <ProjectList
          projects={projects}
          selectedProjectId={selectedProjectId}
          onRemoveProject={removeProjectRow}
          onSelectProject={setSelectedProjectId}
        />
        <ChartsPreview projects={projects} />
      </main>

      <Footer />

      <ContextModal
        isOpen={Boolean(activeContextProject)}
        contextText={activeContextProject?.context ?? ""}
        projectName={activeContextProject?.projectName ?? ""}
        onClose={() => setActiveContextProjectId(null)}
        onSave={saveContext}
      />
    </>
  );
}
