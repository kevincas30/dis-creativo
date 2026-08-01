import { Document } from "@react-pdf/renderer";
import "@/lib/pdf/fonts";
import CoverPage from "@/lib/pdf/pages/CoverPage";
import ProposalPage from "@/lib/pdf/pages/ProposalPage";
import TermsPage from "@/lib/pdf/pages/TermsPage";
import type { QuotePdfData } from "@/lib/pdf/types";

export type { QuotePdfData };

export default function QuotePdfDocument({
  quote,
  logos,
}: {
  quote: QuotePdfData;
  logos: { white: Buffer; black: Buffer; square: Buffer; signature: Buffer };
}) {
  return (
    <Document>
      <CoverPage quote={quote} logoWhite={logos.white} />
      <ProposalPage quote={quote} logoSquare={logos.square} />
      <TermsPage logoSquare={logos.square} signature={logos.signature} />
    </Document>
  );
}
