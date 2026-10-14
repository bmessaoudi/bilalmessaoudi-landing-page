// Draws the world map hung on the right wall of the room (blender/posters/world_map.png),
// from Natural Earth country shapes. Run with: node blender/export-map.mts, then rebake.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import sharp from "sharp";
import { feature, mesh } from "topojson-client";

const require = createRequire(import.meta.url);
const world = JSON.parse(readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8"));

// the frame in room.py is 1.0 x 0.56 m
const W = 2400;
const H = 1344;
const PAD = 70;

const sphere = { type: "Sphere" } as const;
const projection = geoNaturalEarth1().fitExtent(
  [
    [PAD, PAD],
    [W - PAD, H - PAD],
  ],
  sphere,
);
const path = geoPath(projection);

const land = feature(world, world.objects.land);
const borders = mesh(world, world.objects.countries, (a, b) => a !== b);

// an old school atlas: pale sea, warm land, thin ink lines
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="100%" height="100%" fill="#EFE6D2"/>
  <path d="${path(sphere)}" fill="#B9CBC6"/>
  <path d="${path(geoGraticule10())}" fill="none" stroke="#8FA7A3" stroke-width="1.6"/>
  <path d="${path(land as never)}" fill="#E8DCC0" stroke="#6E604B" stroke-width="2.4"/>
  <path d="${path(borders as never)}" fill="none" stroke="#9C8B6E" stroke-width="1.3"/>
  <path d="${path(sphere)}" fill="none" stroke="#4E4434" stroke-width="4"/>
</svg>`;

const out = new URL("./posters/world_map.png", import.meta.url).pathname;
await sharp(Buffer.from(svg)).png().toFile(out);
console.log("world_map.png");
