/**
 * generate-icons.mjs
 * One-time script: generates PWA PNG icons from public/favicon.svg using sharp.
 * Usage: node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgBuffer = readFileSync(resolve(root, "public/favicon.svg"));
const outDir = resolve(root, "public/icons");

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    await sharp(svgBuffer).resize(size, size).png().toFile(resolve(outDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);

    const padding = Math.round(size * 0.1);
    const innerSize = size - padding * 2;
    await sharp(svgBuffer)
      .resize(innerSize, innerSize)
      .extend({ top: padding, bottom: padding, left: padding, right: padding, background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(resolve(outDir, `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }
  console.log("All PWA icons generated.");
}

generateIcons().catch(err => { console.error(err.message); process.exit(1); });
