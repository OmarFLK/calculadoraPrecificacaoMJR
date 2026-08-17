import { useEffect, useMemo, useRef, useState } from "react";
import AiAssistant from "./components/AiAssistant";
import ContextModal from "./components/ContextModal";
import Footer from "./components/Footer";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import MondayDemandCard, { type MondayDemandSignal } from "./components/MondayDemandCard";
import PricingForm from "./components/PricingForm";
import ResultCard from "./components/ResultCard";
import { createEmptyPricingProject, SAMPLE_HISTORICAL_PROJECTS } from "./data/services";
import type { PricingProject } from "./types/pricing";

const createProjectId = () => crypto.randomUUID();
const PROJECT_STORAGE_KEY = "maua-pricing-projects-v2";

const normalizeProject = (project: PricingProject): PricingProject => ({
  ...createEmptyPricingProject(project.id),
  ...project,
  serviceMultiplierValues: project.serviceMultiplierValues ?? {},
});

const loadStoredProjects = (): PricingProject[] => {
  try {
    const storedProjects = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!storedProjects) {
      return SAMPLE_HISTORICAL_PROJECTS;
    }

    const parsedProjects = JSON.parse(storedProjects) as unknown;
    if (
      Array.isArray(parsedProjects) &&
      parsedProjects.length > 0 &&
      parsedProjects.every((project) => typeof project === "object" && project !== null && "id" in project)
    ) {
      return (parsedProjects as PricingProject[]).map(normalizeProject);
    }
  } catch {
    window.localStorage.removeItem(PROJECT_STORAGE_KEY);
  }

  return SAMPLE_HISTORICAL_PROJECTS;
};

export default function App() {
  const saveMessageTimeoutRef = useRef<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => window.sessionStorage.getItem("maua-pricing-authenticated") === "true",
  );
  const [projects, setProjects] = useState<PricingProject[]>(loadStoredProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(() => projects[0].id);
  const [activeContextProjectId, setActiveContextProjectId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [mondayDemandSignal, setMondayDemandSignal] = useState<MondayDemandSignal | null>(null);

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
    window.localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => () => {
    if (saveMessageTimeoutRef.current !== null) {
      window.clearTimeout(saveMessageTimeoutRef.current);
    }
  }, []);

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
        project.id === projectId ? { ...project, ...changes, isHistorical: false } : project,
      ),
    );
  };

  const saveContext = (contextText: string) => {
    if (activeContextProjectId) {
      updateProject(activeContextProjectId, { context: contextText });
    }

    setActiveContextProjectId(null);
  };

  const saveProject = () => {
    const savedAt = new Date().toISOString();

    setProjects((currentProjects) =>
      currentProjects.map((project) =>
        project.id === activeProject.id ? { ...project, isHistorical: true, savedAt } : project,
      ),
    );
    setSaveMessage("Negociação salva neste navegador.");

    if (saveMessageTimeoutRef.current !== null) {
      window.clearTimeout(saveMessageTimeoutRef.current);
    }
    saveMessageTimeoutRef.current = window.setTimeout(() => setSaveMessage(""), 4200);
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
        <PricingForm
          project={activeProject}
          saveMessage={saveMessage}
          onAddProject={addProjectRow}
          onClearProjects={clearProjects}
          onOpenContext={setActiveContextProjectId}
          onRemoveProject={removeProjectRow}
          onSave={saveProject}
          onUpdateProject={updateProject}
        />
        <ResultCard project={activeProject} projects={projects} mondayDemandSignal={mondayDemandSignal} />
        <AiAssistant project={activeProject} projects={projects} mondayDemandSignal={mondayDemandSignal} />
        <MondayDemandCard area={activeProject.nucleus} onSignalChange={setMondayDemandSignal} />
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
