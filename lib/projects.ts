export interface Project {
  title: string;
  description: string;
  tags: string[];
  image: string;
  url?: string;
  color: string;
}

export const projects: Project[] = [
  {
    title: "E-Commerce Platform",
    description:
      "Piattaforma e-commerce completa con pagamenti Stripe, dashboard admin e gestione inventario in tempo reale.",
    tags: ["Next.js", "TypeScript", "Stripe", "Prisma"],
    image: "/projects/ecommerce.webp",
    color: "#007BFF",
  },
  {
    title: "Fitness Tracker App",
    description:
      "App mobile cross-platform per il tracking di allenamenti, nutrizione e progressi con grafici interattivi.",
    tags: ["React Native", "Expo", "Node.js", "MongoDB"],
    image: "/projects/fitness.webp",
    color: "#8A2BE2",
  },
  {
    title: "SaaS Dashboard",
    description:
      "Dashboard analytics real-time con visualizzazioni dati avanzate, auth multi-tenant e API RESTful.",
    tags: ["React", "TailwindCSS", "D3.js", "PostgreSQL"],
    image: "/projects/dashboard.webp",
    color: "#00D4AA",
  },
  {
    title: "Restaurant Booking",
    description:
      "Sistema di prenotazione ristoranti con gestione tavoli, menu digitale e notifiche push.",
    tags: ["Next.js", "Expo", "Firebase", "Stripe"],
    image: "/projects/restaurant.webp",
    color: "#FF6B35",
  },
  {
    title: "Portfolio Creativo",
    description:
      "Sito portfolio immersivo con animazioni WebGL, smooth scroll e transizioni cinematografiche.",
    tags: ["Next.js", "GSAP", "OGL", "TailwindCSS"],
    image: "/projects/portfolio.webp",
    color: "#E040FB",
  },
];
