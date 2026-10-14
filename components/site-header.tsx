import Link from "next/link";
import type { Copy } from "@/lib/content/copy";
import type { Locale, SectionId } from "@/lib/content/types";
import { Logo } from "./doodles";

type Props = { copy: Copy; locale: Locale; active: SectionId; paper: boolean; inert: boolean };

const LINKS: Exclude<SectionId, "ciao">[] = ["lavori", "metodo", "chi", "contatti"];

// Over the room the header is light on a soft shade; over paper it turns to ink on paper.
export function SiteHeader({ copy, locale, active, paper, inert }: Props) {
  const soft = paper ? "text-ink-soft" : "text-light-soft";
  return (
    <header
      inert={inert}
      className={`fixed inset-x-0 top-0 z-10 flex h-[60px] items-center gap-4 px-[var(--pad)] pt-[env(safe-area-inset-top,0px)] transition-colors duration-300 wide:h-[72px] wide:gap-7 ${
        paper ? "bg-paper text-ink" : "bg-gradient-to-b from-[rgb(15_17_23/0.7)] to-transparent text-light"
      }`}
    >
      <a href="#ciao" aria-label="devbybil, Bilal Messaoudi" className="flex items-center gap-3 no-underline">
        <Logo className={`h-8 transition-colors wide:h-9 ${paper ? "text-lamp-ink" : "text-lamp"}`} />
        <span aria-hidden="true" className={`hidden text-sm wide:inline ${soft}`}>
          Bilal Messaoudi
        </span>
      </a>
      <nav aria-label={copy.nav.sections} className="ml-auto flex items-baseline gap-3.5 text-sm wide:gap-6 wide:text-[15px]">
        {LINKS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            className={`underline-offset-[0.3em] ${id === "chi" ? "hidden wide:inline" : ""} ${active === id ? "underline" : `no-underline ${soft}`} ${
              paper ? "hover:text-lamp-ink" : "hover:text-lamp"
            }`}
          >
            {copy.nav[id]}
          </a>
        ))}
        <Link
          href={copy.otherLocale.href}
          hrefLang={locale === "it" ? "en" : "it"}
          lang={locale === "it" ? "en" : "it"}
          aria-label={copy.otherLocale.name}
          className={`border-l pl-3.5 text-[13px] no-underline wide:pl-6 ${soft} ${paper ? "border-ink/20 hover:text-lamp-ink" : "border-light/30 hover:text-lamp"}`}
        >
          {copy.otherLocale.label}
        </Link>
      </nav>
    </header>
  );
}
