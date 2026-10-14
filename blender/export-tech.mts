// Draws the technology posters hung in the room (blender/posters/*.png) from lib/content/tech.ts.
// Run with: node blender/export-tech.mts, then rebake.
import { mkdirSync } from "node:fs";
import sharp from "sharp";
import * as icons from "simple-icons";
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

type Poster = {
  file: string;
  /** Size in pixels; the aspect ratio matches the frame in room.py. */
  w: number;
  h: number;
  paper: string;
  cols: number;
  ids: TechId[];
  /** "brand" keeps each logo's colour, otherwise every logo is drawn in this colour. */
  ink: "brand" | string;
};

const withIcon = TECH_IDS.filter((id) => "icon" in TECH[id]);
// the big print carries the everyday tools, the two small ones the rest
const MAIN: TechId[] = ["nextjs", "react", "typescript", "node", "python", "fastapi", "mongodb", "postgres", "claude", "mcp", "cloudflare", "docker", "stripe", "sanity", "expo", "threejs"];
const SMALL_B: TechId[] = ["hono", "express", "sqlite", "resend"];
const SMALL_C = withIcon.filter((id) => !MAIN.includes(id) && !SMALL_B.includes(id));

const POSTERS: Poster[] = [
  { file: "poster_main", w: 1200, h: 1620, paper: "#EFE8DA", cols: 4, ids: MAIN, ink: "brand" },
  { file: "poster_b", w: 780, h: 930, paper: "#2F3542", cols: 2, ids: SMALL_B, ink: "#EFE8DA" },
  { file: "poster_c", w: 780, h: 840, paper: "#D9A441", cols: 2, ids: SMALL_C, ink: INK },
];

function svg(p: Poster) {
  const margin = p.w * 0.09;
  const rows = Math.ceil(p.ids.length / p.cols);
  const cw = (p.w - 2 * margin) / p.cols;
  const ch = (p.h - 2 * margin) / rows;
  const size = Math.min(cw, ch) * 0.6;
  const cells = p.ids.map((id, i) => {
    const icon = iconOf(id);
    let fill = p.ink === "brand" ? `#${icon.hex}` : p.ink;
    // logos too light or too close to the paper fall back to ink
    if (p.ink === "brand" && (lum(icon.hex) > 0.7 || Math.abs(lum(icon.hex) - lum(p.paper.slice(1))) < 0.25)) fill = INK;
    const cx = margin + cw * (i % p.cols) + cw / 2;
    const cy = margin + ch * Math.floor(i / p.cols) + ch / 2;
    const k = size / 24;
    return `<path transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k})" fill="${fill}" d="${icon.path}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}"><rect width="100%" height="100%" fill="${p.paper}"/>${cells.join("")}</svg>`;
}

const dir = new URL("./posters/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const p of POSTERS) {
  const missing = p.ids.filter((id) => !iconOf(id));
  if (missing.length) throw new Error(`no icon for ${missing.join(", ")}`);
  await sharp(Buffer.from(svg(p))).png().toFile(new URL(`${p.file}.png`, dir).pathname);
  console.log(`${p.file}: ${p.ids.map((id) => TECH[id].name).join(", ")}`);
}
