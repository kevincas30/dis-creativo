import type { ReactNode } from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { INK, MUTED, LINE } from "@/lib/pdf/colors";
import { TITLE_FONT_FAMILY } from "@/lib/pdf/fonts";
import type { QuotePdfData } from "@/lib/pdf/types";
import { formatMoney } from "@/lib/pdf/format";

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  logo: { width: 30, height: 30, borderRadius: 6 },
  headerTitle: { fontFamily: TITLE_FONT_FAMILY, fontWeight: 500, fontSize: 15, color: INK },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: INK, marginBottom: 10, marginTop: 4 },
  bulletRow: { flexDirection: "row", marginBottom: 8, paddingRight: 20 },
  bulletMark: { width: 12, fontSize: 9.5, color: MUTED },
  bulletText: { flex: 1, fontSize: 9.5, color: MUTED, lineHeight: 1.5 },
  bold: { fontWeight: 700, color: INK },
  spacer: { flex: 1 },
  bottomGap: { height: 26 },
  footer: { borderTopWidth: 1, borderTopColor: LINE, paddingTop: 16 },
  thanks: { fontSize: 9.5, color: MUTED, marginBottom: 10 },
  signerName: { fontSize: 10, fontWeight: 700, color: INK },
  contact: { fontSize: 8.5, color: MUTED, marginTop: 2, marginBottom: 44 },
  signatureRow: { flexDirection: "row", justifyContent: "space-between", gap: 40 },
  signatureBlock: { flex: 1 },
  lineWrap: { position: "relative" },
  signatureImage: { position: "absolute", bottom: 0, alignSelf: "center", width: 80, height: 33 },
  signatureLine: { borderTopWidth: 1, borderTopColor: MUTED, marginBottom: 6 },
  signatureLabel: { fontSize: 8.5, color: MUTED, textAlign: "center" },
  signatureNameLabel: { fontSize: 8.5, fontWeight: 700, color: INK, textAlign: "center" },
});

function Bullet({ children }: { children: ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletMark}>·</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function TermsPage({ quote, logoSquare, signature }: { quote: QuotePdfData; logoSquare: Buffer; signature: Buffer }) {
  const amount = quote.depositKind === "NONE" ? 0 : quote.depositKind === "FULL" ? quote.total : quote.depositKind === "FIXED" ? Math.min(quote.total, quote.depositValue) : quote.total * quote.depositValue / 100;
  const label = quote.depositKind === "NONE" ? "No se requiere anticipo" : quote.depositKind === "FULL" ? "Se requiere pago completo" : quote.depositKind === "FIXED" ? "Se requiere un anticipo fijo" : `Se requiere un anticipo del ${quote.depositValue}%`;
  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.headerRow}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aquí es el primitivo de @react-pdf/renderer, no <img> del DOM */}
        <Image src={logoSquare} style={styles.logo} />
        <Text style={styles.headerTitle}>Condiciones y alcance del proyecto</Text>
      </View>

      <Text style={styles.sectionTitle}>Alcance del proyecto</Text>
      <Bullet>Los servicios se desarrollarán con base en la información proporcionada por el cliente.</Bullet>
      <Bullet>
        Cualquier requerimiento adicional o cambio fuera del alcance descrito se cotizará por separado.
      </Bullet>
      <Bullet>Los materiales finales se entregarán en formato digital.</Bullet>
      <Bullet>
        El tiempo estimado del proyecto comenzará una vez recibido el anticipo y el material necesario.
      </Bullet>
      <Bullet>
        La comunicación y seguimiento del proyecto se realizará por los canales acordados entre ambas partes.
      </Bullet>

      <Text style={{ ...styles.sectionTitle, marginTop: 22 }}>Condiciones comerciales</Text>
      <Bullet>
        Este presupuesto tiene una validez de <Text style={styles.bold}>15 días naturales</Text>.
      </Bullet>
      <Bullet>
        <Text style={styles.bold}>{label} ({formatMoney(amount, quote.currency)})</Text> para iniciar el proyecto.
      </Bullet>
      <Bullet>El saldo restante se liquida antes de la entrega final.</Bullet>
      <Bullet>
        La propuesta incluye hasta <Text style={styles.bold}>3 rondas de ajustes menores</Text>; cambios
        adicionales podrán generar costos extra.
      </Bullet>
      <Bullet>
        Los tiempos de entrega pueden ajustarse si el cliente retrasa la entrega de materiales o aprobaciones.
      </Bullet>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <Text style={styles.thanks}>Gracias por confiar en Diseño Creativo para este proyecto.</Text>
        <Text style={styles.signerName}>Kevin Castillo — Diseño Creativo</Text>
        <Text style={styles.contact}>disenocreativo04@gmail.com · +34 625 959 676</Text>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBlock}>
            <View style={styles.lineWrap}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- Image aquí es el primitivo de @react-pdf/renderer, no <img> del DOM */}
              <Image src={signature} style={styles.signatureImage} />
              <View style={styles.signatureLine} />
            </View>
            <Text style={styles.signatureNameLabel}>Kevin Castillo</Text>
            <Text style={styles.signatureLabel}>Diseño Creativo</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.lineWrap}>
              <View style={styles.signatureLine} />
            </View>
            <Text style={styles.signatureLabel}>Cliente</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomGap} />
    </Page>
  );
}
