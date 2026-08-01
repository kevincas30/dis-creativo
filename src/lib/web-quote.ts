// Datos extra que solo aplican a presupuestos de sitios web (formato de PDF
// extendido). Se guardan dentro de Quote.questionnaireAnswers.webQuote —no
// justifica una migración de esquema propia— y se leen tanto desde el
// generador de PDF como desde processBudgetRequest.

export type WebQuoteMenuItem = {
  label: string;
  detail: string;
  children: string[];
};

export type WebQuoteDetails = {
  isWebProject: boolean;
  summary: string;
  menuStructure: WebQuoteMenuItem[];
  maintenanceFee: number;
  maintenanceDescription: string;
  futureScalability: string;
};

export function parseWebQuoteDetails(questionnaireAnswers: unknown): WebQuoteDetails | null {
  if (!questionnaireAnswers || typeof questionnaireAnswers !== "object") return null;
  const webQuote = (questionnaireAnswers as Record<string, unknown>).webQuote;
  if (!webQuote || typeof webQuote !== "object") return null;

  const data = webQuote as Record<string, unknown>;
  if (!data.isWebProject) return null;

  return {
    isWebProject: true,
    summary: typeof data.summary === "string" ? data.summary : "",
    menuStructure: Array.isArray(data.menuStructure)
      ? data.menuStructure.map((raw) => {
          const item = (raw ?? {}) as Record<string, unknown>;
          return {
            label: typeof item.label === "string" ? item.label : "",
            detail: typeof item.detail === "string" ? item.detail : "",
            children: Array.isArray(item.children) ? item.children.filter((c): c is string => typeof c === "string") : [],
          };
        })
      : [],
    maintenanceFee: typeof data.maintenanceFee === "number" ? data.maintenanceFee : 50,
    maintenanceDescription: typeof data.maintenanceDescription === "string" ? data.maintenanceDescription : "",
    futureScalability: typeof data.futureScalability === "string" ? data.futureScalability : "",
  };
}
