import path from "path";
import { Font } from "@react-pdf/renderer";

export const TITLE_FONT_FAMILY = "Caraque Melted";

Font.register({
  family: TITLE_FONT_FAMILY,
  src: path.join(process.cwd(), "src/lib/pdf/fonts/Caraque-MediumMelted.otf"),
  fontWeight: 500,
});
