import type { ReactNode } from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { TEAL, TEAL_SOFT, INK, MUTED, LINE } from "@/lib/pdf/colors";
import { formatDate, formatMoney } from "@/lib/pdf/format";
import type { QuotePdfData } from "@/lib/pdf/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
  logo: { width: 30, height: 30, borderRadius: 6 },
  studioName: { fontSize: 11, fontWeight: 700, color: INK },
  headerRight: { marginLeft: "auto", alignItems: "flex-end" },
  metaLine: { fontSize: 8, color: MUTED },

  title: { fontSize: 24, fontWeight: 700, color: INK },
  subtitle: { fontSize: 11, color: MUTED, marginTop: 4 },
  headerDivider: { height: 1, backgroundColor: LINE, marginTop: 18, marginBottom: 26 },

  section: { marginBottom: 22 },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: 700,
    color: INK,
    borderLeftWidth: 3,
    borderLeftColor: TEAL,
    paddingLeft: 8,
    marginBottom: 10,
  },
  paragraph: { fontSize: 9.5, color: MUTED, lineHeight: 1.55, marginBottom: 8 },

  menuRow: { marginBottom: 8 },
  menuLabelRow: { flexDirection: "row" },
  menuBullet: { width: 10, fontSize: 9.5, color: TEAL },
  menuLabel: { fontSize: 9.5, fontWeight: 700, color: INK },
  menuDetail: { fontSize: 9.5, color: MUTED },
  menuChildren: { marginTop: 3, marginLeft: 22 },
  menuChildRow: { flexDirection: "row", marginBottom: 2 },
  menuChildBullet: { width: 10, fontSize: 9, color: MUTED },
  menuChildText: { fontSize: 9, color: MUTED },

  table: { borderWidth: 1, borderColor: LINE, borderRadius: 6, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", backgroundColor: INK },
  tableHeaderCellLeft: { flex: 1, padding: 8, fontSize: 8.5, fontWeight: 700, color: "#ffffff" },
  tableHeaderCellRight: { width: 100, padding: 8, fontSize: 8.5, fontWeight: 700, color: "#ffffff", textAlign: "right" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: LINE },
  tableCellLeft: { flex: 1, padding: 8 },
  tableCellRight: { width: 100, padding: 8, textAlign: "right" },
  tableItemTitle: { fontSize: 9.5, fontWeight: 700, color: INK },
  tableItemDetail: { fontSize: 8.5, color: MUTED, marginTop: 2 },
  tableItemValue: { fontSize: 9.5, color: INK },
  totalRow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: LINE, backgroundColor: TEAL_SOFT },
  totalLabel: { flex: 1, padding: 8, fontSize: 9.5, fontWeight: 700, color: TEAL },
  totalValue: { width: 100, padding: 8, fontSize: 10.5, fontWeight: 700, color: TEAL, textAlign: "right" },

  callout: {
    borderLeftWidth: 3,
    borderLeftColor: TEAL,
    backgroundColor: TEAL_SOFT,
    borderRadius: 4,
    padding: 12,
  },
  calloutText: { fontSize: 9.5, color: INK, lineHeight: 1.5 },

  milestoneRow: { flexDirection: "row", marginBottom: 8, paddingRight: 20 },
  milestoneBullet: { width: 12, fontSize: 9.5, color: MUTED },
  milestoneText: { flex: 1, fontSize: 9.5, color: MUTED, lineHeight: 1.5 },
  bold: { fontWeight: 700, color: INK },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 7.5, color: MUTED },
});

function Section({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.sectionHeading}>
        {number}. {title}
      </Text>
      {children}
    </View>
  );
}

function Milestone({ children }: { children: ReactNode }) {
  return (
    <View style={styles.milestoneRow}>
      <Text style={styles.milestoneBullet}>·</Text>
      <Text style={styles.milestoneText}>{children}</Text>
    </View>
  );
}

export default function WebQuoteDocument({ quote, logoSquare }: { quote: QuotePdfData; logoSquare: Buffer }) {
  const details = quote.webDetails;
  const primaryItem = quote.lineItems[0];
  const projectTitle = primaryItem?.serviceName ?? primaryItem?.description ?? "Sitio web";
  const footerLabel = `${quote.client?.company ?? quote.client?.name ?? "Diseño Creativo"} — Presupuesto Web`;

  const anticipo = Math.round(quote.total * 0.4 * 100) / 100;
  const intermedio = Math.round(quote.total * 0.3 * 100) / 100;
  const entrega = Math.round((quote.total - anticipo - intermedio) * 100) / 100;

  const summaryParagraphs = (details?.summary ?? "").split(/\n{2,}/).filter((p) => p.trim());
  const hasMenuStructure = (details?.menuStructure.length ?? 0) > 0;
  const hasScalabilityNote = Boolean(details?.futureScalability?.trim());

  const sections: Array<{ title: string; content: ReactNode }> = [];

  if (summaryParagraphs.length > 0) {
    sections.push({
      title: "Resumen y Enfoque del Proyecto",
      content: summaryParagraphs.map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      )),
    });
  }

  if (hasMenuStructure) {
    sections.push({
      title: "Arquitectura de Información (Estructura de Menú)",
      content: details!.menuStructure.map((item, index) => (
        <View key={index} style={styles.menuRow}>
          <View style={styles.menuLabelRow}>
            <Text style={styles.menuBullet}>·</Text>
            <Text>
              <Text style={styles.menuLabel}>{item.label}: </Text>
              <Text style={styles.menuDetail}>{item.detail}</Text>
            </Text>
          </View>
          {item.children.length > 0 ? (
            <View style={styles.menuChildren}>
              {item.children.map((child, childIndex) => (
                <View key={childIndex} style={styles.menuChildRow}>
                  <Text style={styles.menuChildBullet}>◦</Text>
                  <Text style={styles.menuChildText}>{child}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )),
    });
  }

  sections.push({
    title: "Propuesta Económica Detallada",
    content: (
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeaderCellLeft}>Concepto</Text>
          <Text style={styles.tableHeaderCellRight}>Costo</Text>
        </View>
        {quote.lineItems.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.tableCellLeft}>
              <Text style={styles.tableItemTitle}>{item.serviceName ?? item.description}</Text>
              {item.serviceName && item.description ? (
                <Text style={styles.tableItemDetail}>{item.description}</Text>
              ) : null}
            </View>
            <Text style={[styles.tableCellRight, styles.tableItemValue]}>
              {formatMoney(item.lineTotal, quote.currency)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL DESARROLLO</Text>
          <Text style={styles.totalValue}>{formatMoney(quote.total, quote.currency)}</Text>
        </View>
      </View>
    ),
  });

  sections.push({
    title: "Mantenimiento Técnico Mensual",
    content: (
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={styles.tableHeaderCellLeft}>Servicio Recurrente</Text>
          <Text style={styles.tableHeaderCellRight}>Tarifa</Text>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCellLeft}>
            <Text style={styles.tableItemTitle}>Mantenimiento Integral y Soporte Mensual</Text>
            <Text style={styles.tableItemDetail}>
              {details?.maintenanceDescription ||
                "Monitoreo de disponibilidad, copias de seguridad, actualizaciones de seguridad y soporte técnico."}
            </Text>
          </View>
          <Text style={[styles.tableCellRight, styles.tableItemValue]}>
            {formatMoney(details?.maintenanceFee ?? 50, quote.currency)} / mes
          </Text>
        </View>
      </View>
    ),
  });

  if (hasScalabilityNote) {
    sections.push({
      title: "Escalabilidad Futura (Fase 2)",
      content: (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>{details!.futureScalability}</Text>
        </View>
      ),
    });
  }

  sections.push({
    title: "Términos Comerciales y Modalidad de Pago",
    content: (
      <>
        <Text style={styles.paragraph}>
          La forma de pago se estructura bajo la modalidad de hitos por avance (40% / 30% / 30%), distribuidos de
          la siguiente manera sobre el total de desarrollo (<Text style={styles.bold}>{formatMoney(quote.total, quote.currency)}</Text>):
        </Text>
        <Milestone>
          <Text style={styles.bold}>40% Anticipo Inicial ({formatMoney(anticipo, quote.currency)}):</Text> al
          iniciar el proyecto.
        </Milestone>
        <Milestone>
          <Text style={styles.bold}>30% Pago Intermedio ({formatMoney(intermedio, quote.currency)}):</Text> al
          completar la maquetación y estructura base del sitio.
        </Milestone>
        <Milestone>
          <Text style={styles.bold}>30% Pago Contra Entrega ({formatMoney(entrega, quote.currency)}):</Text> tras
          la puesta en marcha definitiva y entrega de accesos.
        </Milestone>
        <Milestone>
          <Text style={styles.bold}>Mantenimiento:</Text> se factura de forma mensual a partir del primer mes
          posterior al lanzamiento.
        </Milestone>
        <Milestone>
          <Text style={styles.bold}>Plazo de entrega estimado:</Text>{" "}
          {quote.deliveryTimeline || "A definir según el alcance del proyecto"}.
        </Milestone>
      </>
    ),
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aquí es el primitivo de @react-pdf/renderer, no <img> del DOM */}
          <Image src={logoSquare} style={styles.logo} />
          <Text style={styles.studioName}>Diseño Creativo</Text>
          <View style={styles.headerRight}>
            <Text style={styles.metaLine}>Fecha: {formatDate(quote.issuedAt)}</Text>
          </View>
        </View>

        <Text style={styles.title}>PRESUPUESTO WEB</Text>
        <Text style={styles.subtitle}>{projectTitle}</Text>
        <View style={styles.headerDivider} />

        {sections.map((section, index) => (
          <Section key={section.title} number={index + 1} title={section.title}>
            {section.content}
          </Section>
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{footerLabel}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
