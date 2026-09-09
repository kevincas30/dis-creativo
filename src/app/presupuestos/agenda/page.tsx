import { redirect } from "next/navigation";
/** La antigua agenda de Presupuestos queda integrada en la Agenda principal. */
export default function LegacyQuoteAgendaRedirect() { redirect("/agenda"); }
