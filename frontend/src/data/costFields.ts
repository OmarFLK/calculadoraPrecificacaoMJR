import type { Nucleus } from "../types/pricing";

export type CostFieldType = "currency" | "number" | "text" | "free-list";

export interface CostFieldDefinition {
  id: string;
  label: string;
  type: CostFieldType;
  required?: boolean;
  help?: string;
}

export interface ProjectAreaDefinition {
  id: string;
  name: Nucleus;
  specificCostFields: CostFieldDefinition[];
}

export const UNIVERSAL_COST_FIELDS: CostFieldDefinition[] = [
  {
    id: "transport_cost",
    label: "Custo de transporte",
    type: "currency",
  },
  {
    id: "additional_costs",
    label: "Custos extras / adicionais",
    type: "free-list",
  },
];

export const PROJECT_AREAS: Record<Nucleus, ProjectAreaDefinition> = {
  Tecnologia: {
    id: "tecnologia",
    name: "Tecnologia",
    specificCostFields: [],
  },
  "Gestão Empresarial": {
    id: "gestao-empresarial",
    name: "Gestão Empresarial",
    specificCostFields: [],
  },
  Design: {
    id: "design",
    name: "Design",
    specificCostFields: [],
  },
  "Gestão de Processos": {
    id: "cronogramas-producao",
    name: "Gestão de Processos",
    specificCostFields: [
      {
        id: "team_stage_transport_cost",
        label: "Transporte da equipe / etapa",
        type: "currency",
      },
    ],
  },
  "Química e Alimentos": {
    id: "quimica-alimentos",
    name: "Química e Alimentos",
    specificCostFields: [
      {
        id: "material_cost",
        label: "Custo de material",
        type: "currency",
        required: true,
      },
      {
        id: "material_transport_cost",
        label: "Transporte do material",
        type: "currency",
      },
    ],
  },
};

export function getCostFieldsForArea(area: Nucleus | ""): CostFieldDefinition[] {
  const specificFields = area ? PROJECT_AREAS[area].specificCostFields : [];
  return [...UNIVERSAL_COST_FIELDS, ...specificFields];
}

export function getUniversalCostValueIds(): Set<string> {
  return new Set(
    UNIVERSAL_COST_FIELDS.filter((field) => field.type !== "free-list").map(
      (field) => field.id,
    ),
  );
}
