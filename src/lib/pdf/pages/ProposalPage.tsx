import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { TEAL, MUTED, INK, LINE, LIGHT_BLUE } from "@/lib/pdf/colors";
import { formatDate, formatMoney, quoteNumber } from "@/lib/pdf/format";
import { TITLE_FONT_FAMILY } from "@/lib/pdf/fonts";
import type { QuotePdfData } from "@/lib/pdf/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 42,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 40, height: 40, borderRadius: 8 },
  studioName: { fontSize: 11, fontWeight: 700, color: INK },
  contactLabel: { fontSize: 7.5, color: MUTED, marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  metaLine: { fontSize: 8, color: MUTED, marginBottom: 2 },
  projectTitle: {
    fontFamily: TITLE_FONT_FAMILY,
    fontWeight: 500,
    fontSize: 19,
    color: INK,
    marginBottom: 8,
  },
  intro: { fontSize: 9.5, color: MUTED, lineHeight: 1.5, marginBottom: 24, maxWidth: 420 },
  contentRow: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  servicesColumn: { flex: 1.6 },
  summaryColumn: { flex: 1 },
  card: {
    borderWidth: 1,
    borderColor: LINE,
    borderTopWidth: 3,
    borderTopColor: TEAL,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 11, fontWeight: 700, color: INK, flex: 1, paddingRight: 10 },
  cardPrice: { fontSize: 12, fontWeight: 700, color: TEAL },
  cardDescription: { fontSize: 9, color: MUTED, marginTop: 5, lineHeight: 1.4 },
  cardQty: { fontSize: 8, color: MUTED, marginTop: 6 },
  summaryBox: {
    borderWidth: 1,
    borderColor: TEAL,
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#f7fbfc",
  },
  summaryLabel: { fontSize: 7, fontWeight: 700, color: MUTED, letterSpacing: 1, marginBottom: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryRowLabel: { fontSize: 9, color: MUTED },
  summaryRowValue: { fontSize: 9, color: INK },
  totalDivider: { height: 1, backgroundColor: LIGHT_BLUE, marginVertical: 8 },
  totalLabel: { fontSize: 12, fontWeight: 700, color: TEAL },
  totalValue: { fontSize: 17, fontWeight: 700, color: TEAL },
  footerBlock: { marginTop: 26 },
  footerRow: { flexDirection: "row", marginBottom: 6 },
  footerLabel: { fontSize: 8.5, fontWeight: 700, color: INK, width: 150 },
  footerValue: { fontSize: 8.5, color: MUTED, flex: 1 },
  thanksNote: { fontSize: 9, color: MUTED, marginTop: 10, fontStyle: "italic" },
});

export default function ProposalPage({ quote, logoSquare }: { quote: QuotePdfData; logoSquare: Buffer }) {
  const primaryItem = quote.lineItems[0];
  const projectTitle = primaryItem?.serviceName ?? primaryItem?.description ?? "Propuesta de servicios";
  const intro =
    quote.salesDescription ??
    "Esta propuesta describe el alcance, los entregables y la inversión necesaria para llevar tu proyecto a cabo con los estándares de calidad de Diseño Creativo.";

  const discountAmount =
    quote.discountType === "PERCENTAGE"
      ? (quote.subtotal * (quote.discountValue ?? 0)) / 100
      : (quote.discountValue ?? 0);
  const discountLabel =
    quote.discountType === "PERCENTAGE"
      ? `Descuento (${quote.discountValue ?? 0}%)`
      : quote.discountType === "FIXED"
        ? "Descuento"
        : null;

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aquí es el primitivo de @react-pdf/renderer, no <img> del DOM */}
          <Image src={logoSquare} style={styles.logo} />
          <View>
            <Text style={styles.studioName}>Diseño Creativo</Text>
            <Text style={styles.contactLabel}>+34 625 959 676</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.metaLine}>Fecha: {formatDate(quote.issuedAt)}</Text>
          <Text style={styles.metaLine}>N.º {quoteNumber(quote.id)}</Text>
        </View>
      </View>

      <Text style={styles.projectTitle}>{projectTitle}</Text>
      <Text style={styles.intro}>{intro}</Text>

      <View style={styles.contentRow}>
        <View style={styles.servicesColumn}>
          {quote.lineItems.length === 0 ? (
            <Text style={{ fontSize: 9, color: MUTED }}>Sin servicios todavía.</Text>
          ) : (
            quote.lineItems.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>{(item.serviceName ?? item.description).toUpperCase()}</Text>
                  <Text style={styles.cardPrice}>{formatMoney(item.lineTotal, quote.currency)}</Text>
                </View>
                {item.serviceName ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
                {item.serviceDescription ? (
                  <Text style={styles.cardDescription}>{item.serviceDescription}</Text>
                ) : null}
                {item.quantity !== 1 ? (
                  <Text style={styles.cardQty}>
                    Cantidad: {item.quantity} × {formatMoney(item.unitPrice, quote.currency)}
                  </Text>
                ) : null}
                {item.discountPercent ? (
                  <Text style={styles.cardQty}>Descuento por volumen: -{item.discountPercent}%</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.summaryColumn}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>RESUMEN FINANCIERO</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>Subtotal</Text>
              <Text style={styles.summaryRowValue}>{formatMoney(quote.subtotal, quote.currency)}</Text>
            </View>
            {discountLabel ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryRowLabel}>{discountLabel}</Text>
                <Text style={styles.summaryRowValue}>-{formatMoney(discountAmount, quote.currency)}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryRowLabel}>
                IVA{quote.taxRatePercent ? ` (${quote.taxRatePercent}%)` : ""}
              </Text>
              <Text style={styles.summaryRowValue}>{formatMoney(quote.taxAmount, quote.currency)}</Text>
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{formatMoney(quote.total, quote.currency)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footerBlock}>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Forma de pago</Text>
          <Text style={styles.footerValue}>50% de anticipo · 50% contra entrega</Text>
        </View>
        <View style={styles.footerRow}>
          <Text style={styles.footerLabel}>Tiempo estimado de entrega</Text>
          <Text style={styles.footerValue}>{quote.deliveryTimeline ?? "A definir según el alcance del proyecto"}</Text>
        </View>
        <Text style={styles.thanksNote}>Gracias por la oportunidad de presentarte esta propuesta.</Text>
      </View>
    </Page>
  );
}
