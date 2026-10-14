import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bilal Messaoudi, sviluppatore full stack",
    short_name: "devbybil",
    description: "Gestionali, siti e agenti AI per aziende.",
    start_url: "/",
    display: "browser",
    background_color: "#1b1f29",
    theme_color: "#1b1f29",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
