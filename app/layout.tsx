import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://bilalmessaoudi.com"),
  title: "Bilal Messaoudi — Sviluppo Web & Mobile Freelance",
  description:
    "Trasformo la tua idea in un prodotto digitale che funziona. Siti web, app mobile, design — un unico referente per il tuo progetto.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Bilal Messaoudi — Sviluppo Web & Mobile Freelance",
    description:
      "Trasformo la tua idea in un prodotto digitale che funziona. Siti web, app mobile, design — un unico referente.",
    type: "website",
    url: "https://bilalmessaoudi.com",
    siteName: "Bilal Messaoudi",
    locale: "it_IT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bilal Messaoudi — Sviluppo Web & Mobile Freelance",
    description:
      "Trasformo la tua idea in un prodotto digitale che funziona.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Person",
                name: "Bilal Messaoudi",
                jobTitle: "Sviluppatore Web & Mobile Freelance",
                url: "https://bilalmessaoudi.com",
                sameAs: [
                  "https://github.com/bmessaoudi",
                  "https://www.linkedin.com/in/bilal-messaoudi-877a6a183",
                ],
                knowsAbout: [
                  "React",
                  "Next.js",
                  "React Native",
                  "Expo",
                  "TypeScript",
                  "Node.js",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "ProfessionalService",
                name: "Bilal Messaoudi — Sviluppo Web & Mobile",
                description:
                  "Sviluppo siti web, app mobile e prodotti digitali su misura.",
                url: "https://bilalmessaoudi.com",
                areaServed: "IT",
                serviceType: [
                  "Sviluppo Web",
                  "Sviluppo App Mobile",
                  "UI/UX Design",
                ],
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "contact@bilalmessaoudi.com",
                  contactType: "customer service",
                  availableLanguage: ["Italian", "English"],
                },
              },
            ]),
          }}
        />
      </head>
      <body
        className={`${GeistSans.variable} bg-[#050505] text-white antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
