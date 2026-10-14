import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content/copy";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = { it: SITE.url, en: `${SITE.url}/en` };
  return [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "monthly", priority: 1, alternates: { languages } },
    { url: `${SITE.url}/en`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9, alternates: { languages } },
  ];
}
