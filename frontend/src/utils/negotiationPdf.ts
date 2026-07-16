import { getCostFieldsForArea } from "../data/costFields";
import { calculateSuggestedPrice, formatCurrency } from "../logic/pricingCalculations";
import type { PricingProject } from "../types/pricing";

const PAGE_MARGIN = 18;
const CONTENT_TOP = 52;
const FOOTER_HEIGHT = 18;

const formatValue = (value: number | "", suffix = "") =>
  value === "" ? "Não informado" : `${new Intl.NumberFormat("pt-BR").format(value)}${suffix}`;

const formatSavedAt = (savedAt?: string) => {
  if (!savedAt) {
    return "Registro histórico";
  }

  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) {
    return "Registro histórico";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
};

const createFileName = (project: PricingProject) => {
  const projectSlug = project.projectName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `negociacao-${projectSlug || project.id}.pdf`;
};

export async function downloadNegotiationPdf(project: PricingProject): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const calculation = calculateSuggestedPrice(project);
  let cursorY = CONTENT_TOP;

  const drawPageMarker = () => {
    pdf.setFillColor(7, 26, 68);
    pdf.rect(0, 0, pageWidth, 9, "F");
  };

  const ensureSpace = (requiredHeight: number) => {
    if (cursorY + requiredHeight <= pageHeight - FOOTER_HEIGHT) {
      return;
    }

    pdf.addPage();
    drawPageMarker();
    cursorY = 20;
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(14);
    pdf.setFillColor(17, 103, 216);
    pdf.roundedRect(PAGE_MARGIN, cursorY, 3, 8, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(7, 26, 68);
    pdf.text(title, PAGE_MARGIN + 7, cursorY + 6);
    cursorY += 12;
  };

  const drawRows = (rows: Array<[string, string]>) => {
    rows.forEach(([label, value], index) => {
      const valueLines = pdf.splitTextToSize(value, 100) as string[];
      const rowHeight = Math.max(10, valueLines.length * 4.2 + 4);
      ensureSpace(rowHeight);

      if (index % 2 === 0) {
        pdf.setFillColor(244, 248, 255);
        pdf.roundedRect(PAGE_MARGIN, cursorY, contentWidth, rowHeight - 1, 1.5, 1.5, "F");
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(70, 84, 107);
      pdf.text(label, PAGE_MARGIN + 4, cursorY + 6);

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(16, 24, 40);
      pdf.text(valueLines, pageWidth - PAGE_MARGIN - 4, cursorY + 6, { align: "right" });
      cursorY += rowHeight;
    });

    cursorY += 4;
  };

  const drawParagraph = (text: string) => {
    const lines = pdf.splitTextToSize(text, contentWidth - 8) as string[];

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(36, 50, 74);

    lines.forEach((line) => {
      ensureSpace(5.2);
      pdf.text(line, PAGE_MARGIN + 4, cursorY);
      cursorY += 4.8;
    });

    cursorY += 5;
  };

  pdf.setProperties({
    title: `Resumo da negociação - ${project.projectName || "Projeto sem nome"}`,
    subject: "Resumo comercial e financeiro da negociação",
    author: "Mauá Jr Pricing AI",
    creator: "Mauá Jr Pricing AI",
  });

  pdf.setFillColor(7, 26, 68);
  pdf.rect(0, 0, pageWidth, 41, "F");
  pdf.setFillColor(18, 168, 201);
  pdf.rect(PAGE_MARGIN, 33, 44, 2.2, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(180, 222, 255);
  pdf.text("MAUÁ JR PRICING AI", PAGE_MARGIN, 15);
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Resumo da negociação", PAGE_MARGIN, 27);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(216, 231, 255);
  pdf.text(formatSavedAt(project.savedAt), pageWidth - PAGE_MARGIN, 27, { align: "right" });

  drawSectionTitle(project.projectName || "Projeto sem nome");
  drawRows([
    ["Núcleo", project.nucleus || "Não informado"],
    ["Serviço", project.service || "Não informado"],
    ["Complexidade", project.complexity || "Não informada"],
    ["Prazo", `${formatValue(project.executionTime)} ${project.timeUnit}`],
  ]);

  drawSectionTitle("Resumo financeiro");
  drawRows([
    ["Valor negociado", formatCurrency(project.chargedValue === "" ? 0 : project.chargedValue)],
    ["Preço final sugerido", formatCurrency(calculation.precoFinal)],
    ["Ticket de referência", formatCurrency(project.referenceTicket === "" ? 0 : project.referenceTicket)],
    ["Custo base", formatCurrency(calculation.custoBase)],
    ["Custos do projeto", formatCurrency(calculation.custosDinamicos)],
    ["Valor com margem", formatCurrency(calculation.valorMargem)],
    ["Valor com impostos", formatCurrency(calculation.valorImpostos)],
    ["Margem desejada", formatValue(project.desiredProfitMargin, "%")],
    ["Impostos", formatValue(project.taxes, "%")],
    ["Multiplicador", calculation.multiplicador.toFixed(2)],
  ]);

  drawSectionTitle("Estrutura da operação");
  drawRows([
    ["Horas totais", formatValue(project.totalWorkedHours, " h")],
    ["Consultores", formatValue(project.consultantsCount)],
    ["Média semanal por consultor", formatValue(project.weeklyHoursAverage, " h")],
    ["Valor médio da hora", project.hourValue === "" ? "Não informado" : formatCurrency(project.hourValue)],
  ]);

  const costFieldLabels = new Map(
    getCostFieldsForArea(project.nucleus)
      .filter((field) => field.type === "currency")
      .map((field) => [field.id, field.label]),
  );
  const costRows: Array<[string, string]> = Object.entries(project.costValues)
    .filter(([, value]) => value !== "")
    .map(([fieldId, value]) => [
      costFieldLabels.get(fieldId) ?? "Custo configurado",
      formatCurrency(value === "" ? 0 : value),
    ]);

  project.additionalCosts.forEach((cost) => {
    if (cost.description.trim() || cost.amount !== "") {
      costRows.push([
        cost.description.trim() || "Custo adicional",
        formatCurrency(cost.amount === "" ? 0 : cost.amount),
      ]);
    }
  });

  if (!costRows.length && project.extraCosts !== "" && project.extraCosts > 0) {
    costRows.push(["Custos adicionais", formatCurrency(project.extraCosts)]);
  }

  drawSectionTitle("Detalhamento de custos");
  drawRows(costRows.length ? costRows : [["Custos adicionais", "Nenhum custo informado"]]);

  drawSectionTitle("Contexto da negociação");
  drawParagraph(project.context.trim() || "Nenhum contexto comercial foi informado.");

  if (project.driveLink.trim()) {
    drawSectionTitle("Documentos relacionados");
    drawParagraph(project.driveLink.trim());
  }

  const totalPages = pdf.getNumberOfPages();
  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    pdf.setPage(pageNumber);
    pdf.setDrawColor(216, 226, 239);
    pdf.line(PAGE_MARGIN, pageHeight - 13, pageWidth - PAGE_MARGIN, pageHeight - 13);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(114, 128, 150);
    pdf.text("Mauá Jr Pricing AI", PAGE_MARGIN, pageHeight - 8);
    pdf.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 8, {
      align: "right",
    });
  }

  pdf.save(createFileName(project));
}
