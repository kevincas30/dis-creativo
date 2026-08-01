import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { formatDate } from "@/lib/pdf/format";
import { TITLE_FONT_FAMILY } from "@/lib/pdf/fonts";
import type { QuotePdfData } from "@/lib/pdf/types";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#000000",
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 56,
    fontFamily: "Helvetica",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  logoTop: { width: 156, height: 156, alignSelf: "center", marginBottom: 36 },
  titleLine1: {
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: 48,
    fontWeight: 500,
    color: "#ffffff",
    letterSpacing: 1,
    textAlign: "center",
  },
  titleLine2: {
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: 48,
    fontWeight: 500,
    color: "#ffffff",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 4,
  },
  metaBlock: { marginBottom: 20 },
  metaLabel: { fontSize: 7, color: "#a1a1aa", letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 10, color: "#ffffff", marginBottom: 10 },
});

export default function CoverPage({ quote, logoWhite }: { quote: QuotePdfData; logoWhite: Buffer }) {
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.center}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aqui es el primitivo de @react-pdf/renderer, no <img> del DOM */}
        <Image src={logoWhite} style={styles.logoTop} />
        <Text style={styles.titleLine1}>Cotización de</Text>
        <Text style={styles.titleLine2}>servicios</Text>
      </View>

      <View style={styles.metaBlock}>
        <Text style={styles.metaLabel}>CLIENTE</Text>
        <Text style={styles.metaValue}>{quote.client?.name ?? "Cliente sin definir"}</Text>
        <Text style={styles.metaLabel}>FECHA</Text>
        <Text style={{ ...styles.metaValue, marginBottom: 0 }}>{formatDate(quote.issuedAt)}</Text>
      </View>
    </Page>
  );
}
