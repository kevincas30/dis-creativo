import { readFileSync } from "fs";
import path from "path";
import sharp from "sharp";

// Los logos son SVG vectoriales puros (sin fondo) — @react-pdf/renderer no
// rasteriza SVG en <Image>, así que los convertimos a PNG una sola vez con
// sharp y cacheamos el buffer resultante para toda la vida del proceso.
async function rasterize(filename: string): Promise<Buffer> {
  const svgPath = path.join(process.cwd(), "public", filename);
  return sharp(readFileSync(svgPath), { density: 300 }).resize(480, 480).png().toBuffer();
}

function readPng(filename: string): Buffer {
  return readFileSync(path.join(process.cwd(), "public", filename));
}

let cached: { white: Buffer; black: Buffer; square: Buffer; signature: Buffer } | null = null;

export async function getLogoBuffers() {
  if (!cached) {
    const [white, black, square] = await Promise.all([
      rasterize("logo-blanco.svg"),
      rasterize("logo-negro.svg"),
      rasterize("logo.svg"),
    ]);
    cached = { white, black, square, signature: readPng("firma-kevin.png") };
  }
  return cached;
}
