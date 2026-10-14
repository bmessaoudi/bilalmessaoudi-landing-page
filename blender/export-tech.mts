// Draws the technology posters hung in the room (blender/posters/*.png) from lib/content/posters.ts,
// and writes their place on the wall to blender/posters/layout.json for room.py.
// Run with: node blender/export-tech.mts, then rebake.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import * as icons from "simple-icons";
import { POSTERS, posterGrid, type Poster } from "../lib/content/posters.ts";
import { TECH, TECH_IDS, type TechId } from "../lib/content/tech.ts";

type Icon = { title: string; hex: string; path: string };
const iconOf = (id: TechId): Icon => {
  const slug = (TECH[id] as { icon?: string }).icon!;
  return (icons as unknown as Record<string, Icon>)[`si${slug[0].toUpperCase()}${slug.slice(1)}`];
};

const INK = "#1A1D25";
const lum = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function svg(p: Poster) {
  const { size, cell } = posterGrid(p);
  const cells = p.ids.map((id, i) => {
    const icon = iconOf(id);
    let fill = p.ink === "brand" ? `#${icon.hex}` : p.ink;
    // logos too light or too close to the paper fall back to ink
    if (p.ink === "brand" && (lum(icon.hex) > 0.7 || Math.abs(lum(icon.hex) - lum(p.paper.slice(1))) < 0.25)) fill = INK;
    const { cx, cy } = cell(i);
    const k = size / 24;
    return `<path transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k})" fill="${fill}" d="${icon.path}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.px}" height="${p.py}"><rect width="100%" height="100%" fill="${p.paper}"/>${cells.join("")}</svg>`;
}

const dir = new URL("./posters/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const p of POSTERS) {
  const missing = p.ids.filter((id) => !iconOf(id));
  if (missing.length) throw new Error(`no icon for ${missing.join(", ")}`);
  await sharp(Buffer.from(svg(p))).png().toFile(new URL(`${p.file}.png`, dir).pathname);
  console.log(`${p.file}: ${p.ids.map((id) => TECH[id].name).join(", ")}`);
}
const layout = POSTERS.map(({ file, x, y, w, h }) => ({ file, x, y, w, h }));
writeFileSync(new URL("layout.json", dir), JSON.stringify(layout, null, 2) + "\n");
// every tool with a logo must hang somewhere
const hung = POSTERS.flatMap((p) => p.ids);
const missing = TECH_IDS.filter((id) => "icon" in TECH[id] && !hung.includes(id));
if (missing.length) throw new Error(`not on a poster: ${missing.join(", ")}`);
