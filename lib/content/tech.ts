// The tools behind the projects. `icon` is a Simple Icons slug, used for the posters in the 3D room
// (blender/export-tech.mts); tools without one only appear on the site. `hex` is the brand colour.

export type TechArea = "web" | "backend" | "ai" | "apps" | "services";

export const TECH_AREAS: TechArea[] = ["web", "backend", "ai", "apps", "services"];

export const TECH = {
  nextjs: { name: "Next.js", hex: "#000000", area: "web", icon: "nextdotjs" },
  react: { name: "React", hex: "#61DAFB", area: "web", icon: "react" },
  typescript: { name: "TypeScript", hex: "#3178C6", area: "web", icon: "typescript" },
  gsap: { name: "GSAP", hex: "#0AE448", area: "web", icon: "gsap" },
  tiptap: { name: "TipTap", hex: "#000000", area: "web" },
  python: { name: "Python", hex: "#3776AB", area: "backend", icon: "python" },
  fastapi: { name: "FastAPI", hex: "#009688", area: "backend", icon: "fastapi" },
  node: { name: "Node.js", hex: "#5FA04E", area: "backend", icon: "nodedotjs" },
  express: { name: "Express", hex: "#000000", area: "backend", icon: "express" },
  hono: { name: "Hono", hex: "#E36002", area: "backend", icon: "hono" },
  mongodb: { name: "MongoDB", hex: "#47A248", area: "backend", icon: "mongodb" },
  postgres: { name: "Postgres", hex: "#4169E1", area: "backend", icon: "postgresql" },
  sqlite: { name: "SQLite", hex: "#003B57", area: "backend", icon: "sqlite" },
  cloudflare: { name: "Cloudflare Workers", hex: "#F38020", area: "backend", icon: "cloudflare" },
  docker: { name: "Docker", hex: "#2496ED", area: "backend", icon: "docker" },
  claude: { name: "Claude", hex: "#D97757", area: "ai", icon: "claude" },
  mcp: { name: "MCP", hex: "#000000", area: "ai", icon: "modelcontextprotocol" },
  firecrawl: { name: "Firecrawl", hex: "#FA5D19", area: "ai" },
  playwright: { name: "Playwright", hex: "#2EAD33", area: "ai" },
  livekit: { name: "LiveKit", hex: "#000000", area: "ai", icon: "livekit" },
  deepgram: { name: "Deepgram", hex: "#13EF93", area: "ai", icon: "deepgram" },
  elevenlabs: { name: "ElevenLabs", hex: "#000000", area: "ai", icon: "elevenlabs" },
  llama: { name: "llama.rn", hex: "#000000", area: "ai" },
  expo: { name: "Expo", hex: "#1C2024", area: "apps", icon: "expo" },
  threejs: { name: "three.js", hex: "#000000", area: "apps", icon: "threedotjs" },
  blender: { name: "Blender", hex: "#E87D0D", area: "apps", icon: "blender" },
  stripe: { name: "Stripe", hex: "#635BFF", area: "services", icon: "stripe" },
  sanity: { name: "Sanity", hex: "#F03E2F", area: "services", icon: "sanity" },
  resend: { name: "Resend", hex: "#000000", area: "services", icon: "resend" },
  telethon: { name: "Telethon", hex: "#26A5E4", area: "services", icon: "telegram" },
} satisfies Record<string, { name: string; hex: string; area: TechArea; icon?: string }>;

export type TechId = keyof typeof TECH;

export const TECH_IDS = Object.keys(TECH) as TechId[];

const PAPER = "#ECEBE6";

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The brand colour, darkened just enough to be read on the paper (WCAG AA, 4.5:1). */
function onPaper(hex: string) {
  // pure black brands take the site ink, which sits better on the paper
  if (hex === "#000000") return "#1A1D25";
  const bg = luminance(PAPER);
  let rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const css = () => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
  while ((bg + 0.05) / (luminance(css()) + 0.05) < 4.5) rgb = rgb.map((c) => c * 0.94);
  return css();
}

export const TECH_COLOR = Object.fromEntries(TECH_IDS.map((id) => [id, onPaper(TECH[id].hex)])) as Record<TechId, string>;
