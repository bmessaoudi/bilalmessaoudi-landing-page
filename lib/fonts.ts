import { Hubot_Sans, IBM_Plex_Mono, Mona_Sans, Shantell_Sans } from "next/font/google";

// GitHub's pair: Mona Sans for reading, Hubot Sans (wide) for headings
export const sans = Mona_Sans({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-mona",
  display: "swap",
});

export const display = Hubot_Sans({
  subsets: ["latin"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-hubot",
  display: "swap",
});

// handwritten notes, arrows and stickers
export const hand = Shantell_Sans({
  subsets: ["latin"],
  weight: "variable",
  axes: ["INFM", "BNCE"],
  variable: "--font-shantell",
  display: "swap",
});

export const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});
