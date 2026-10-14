// Writes blender/books.json from the site content, so the bake prints the real titles on the spines.
// Run with: node blender/export-books.mts
import { writeFileSync } from "node:fs";
import { getProjects } from "../lib/content/projects.ts";

// top shelf first: the shelf reads in the same order as the index
const ROW_OF_GROUP = { ai: 3, business: 2, experiences: 1, mine: 0 } as const;

const books = getProjects("it").map((p) => ({ slug: p.slug, spine: p.spine, color: p.color, row: ROW_OF_GROUP[p.group] }));
writeFileSync(new URL("./books.json", import.meta.url), JSON.stringify(books, null, 2) + "\n");
console.log(`${books.length} books`);
