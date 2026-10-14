import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { getCopy, SITE } from "@/lib/content/copy";
import type { Locale } from "@/lib/content/types";
import { display, hand, mono, sans } from "@/lib/fonts";

export const viewport: Viewport = {
  themeColor: "#1b1f29",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function buildMetadata(locale: Locale): Metadata {
  const copy = getCopy(locale);
  return {
    metadataBase: new URL(SITE.url),
    title: copy.meta.title,
    description: copy.meta.description,
    applicationName: "devbybil",
    authors: [{ name: "Bilal Messaoudi", url: SITE.url }],
    creator: "Bilal Messaoudi",
    alternates: {
      canonical: locale === "it" ? "/" : "/en",
      languages: { it: "/", en: "/en", "x-default": "/" },
    },
    openGraph: {
      title: copy.meta.title,
      description: copy.meta.description,
      type: "website",
      url: locale === "it" ? SITE.url : `${SITE.url}/en`,
      siteName: "Bilal Messaoudi",
      locale: locale === "it" ? "it_IT" : "en_GB",
    },
    twitter: { card: "summary_large_image", title: copy.meta.title, description: copy.meta.description },
  };
}

export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const copy = getCopy(locale);
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Bilal Messaoudi",
    alternateName: "devbybil",
    jobTitle: locale === "it" ? "Sviluppatore full stack freelance" : "Freelance full stack developer",
    description: copy.meta.description,
    url: SITE.url,
    email: SITE.email,
    sameAs: [SITE.github, SITE.linkedin],
    knowsAbout: ["Next.js", "TypeScript", "Node.js", "FastAPI", "Claude API", "Model Context Protocol", "three.js", "Blender"],
  };
  return (
    <html lang={locale} className={`${sans.variable} ${display.variable} ${hand.variable} ${mono.variable}`}>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script src="//unpkg.com/react-grab/dist/index.global.js" crossOrigin="anonymous" strategy="beforeInteractive" />
        )}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      </head>
      <body className="bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}

export const canvasFonts = { sans: sans.style.fontFamily, mono: mono.style.fontFamily };
