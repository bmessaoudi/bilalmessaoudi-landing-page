import type { TechId } from "./tech";

// The three technology prints over the desk. One source for the drawing (blender/export-tech.mts),
// the frames in the room (blender/room.py reads blender/posters/layout.json) and the site, which
// circles a logo on the wall and turns a click on the wall back into a technology.

export type Poster = {
  file: string;
  /** Centre and size on the back wall, in metres (three.js space). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Size of the drawing in pixels, same aspect as w x h. */
  px: number;
  py: number;
  paper: string;
  /** "brand" keeps each logo's colour, otherwise every logo is drawn in this colour. */
  ink: "brand" | string;
  cols: number;
  ids: TechId[];
};

export const POSTERS: Poster[] = [
  // the everyday tools on the big print, the rest on the two small ones
  {
    file: "poster_main",
    x: -0.62,
    y: 1.68,
    w: 0.46,
    h: 0.62,
    px: 1200,
    py: 1620,
    paper: "#EFE8DA",
    ink: "brand",
    cols: 4,
    ids: ["nextjs", "react", "typescript", "node", "python", "fastapi", "mongodb", "postgres", "claude", "mcp", "cloudflare", "docker", "stripe", "sanity", "expo", "threejs"],
  },
  { file: "poster_b", x: -1.15, y: 1.82, w: 0.3, h: 0.357, px: 780, py: 930, paper: "#2F3542", ink: "#EFE8DA", cols: 2, ids: ["hono", "express", "sqlite", "resend"] },
  { file: "poster_c", x: -1.15, y: 1.4, w: 0.3, h: 0.323, px: 780, py: 840, paper: "#D9A441", ink: "#1A1D25", cols: 2, ids: ["gsap", "livekit", "deepgram", "elevenlabs", "blender", "telethon"] },
];

/** The grid the logos sit in, in pixels of the drawing. */
export function posterGrid(p: Poster) {
  const margin = p.px * 0.09;
  const rows = Math.ceil(p.ids.length / p.cols);
  const cw = (p.px - 2 * margin) / p.cols;
  const ch = (p.py - 2 * margin) / rows;
  const size = Math.min(cw, ch) * 0.6;
  const cell = (i: number) => ({ cx: margin + cw * (i % p.cols) + cw / 2, cy: margin + ch * Math.floor(i / p.cols) + ch / 2 });
  return { margin, rows, cw, ch, size, cell };
}
