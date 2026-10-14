import Link from "next/link";
import type { Copy } from "@/lib/content/copy";
import type { Locale, SectionId } from "@/lib/content/types";
import { Logo } from "./doodles";

type Props = { copy: Copy; locale: Locale; active: SectionId; paper: boolean; inert: boolean };

const LINKS: Exclude<SectionId, "ciao" | "stack">[] = ["lavori", "metodo", "chi", "contatti"];

// a slightly uneven line of labels, as if written by hand
const TILT = [-2, 1.5, -1, 2];

// the current section gets a hand-drawn ring
function Circled({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 50" preserveAspectRatio="none" className={`pointer-events-none absolute -inset-x-1.5 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+12px)] wide:-inset-x-3 wide:-inset-y-2 wide:h-[calc(100%+16px)] wide:w-[calc(100%+24px)] ${className}`}>
      <path d="M64 6C34 3 6 10 5 25s28 21 57 20 54-7 53-21C114 9 86 4 52 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

// the others get a squiggle that draws itself in on hover
function Squiggle({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 10" preserveAspectRatio="none" className={`pointer-events-none absolute -bottom-2 left-0 h-2 w-full ${className}`}>
      <path
        d="M2 6c8-5 13 3 21 0s12-5 20-1 13 3 21 0 13-4 20-1 9 2 14 0"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="transition-[stroke-dashoffset] duration-300 [stroke-dasharray:1] [stroke-dashoffset:1] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0]"
      />
    </svg>
  );
}

// the flag of the language you switch to, as a small sticker
function FlagUK() {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice" className="block h-4 w-6 rounded-[3px] wide:h-[18px] wide:w-[27px]">
      <clipPath id="uk-diag">
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30m0-30L0 30" clipPath="url(#uk-diag)" stroke="#C8102E" strokeWidth="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function FlagIT() {
  return (
    <svg aria-hidden="true" viewBox="0 0 3 2" className="block h-4 w-6 rounded-[3px] wide:h-[18px] wide:w-[27px]">
      <path fill="#009246" d="M0 0h1v2H0z" />
      <path fill="#f4f5f0" d="M1 0h1v2H1z" />
      <path fill="#ce2b37" d="M2 0h1v2H2z" />
    </svg>
  );
}

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
      <a href="#ciao" aria-label="devbybil, Bilal Messaoudi" className="no-underline">
        <Logo className={`h-7 transition-colors wide:h-9 ${paper ? "text-lamp-ink" : "text-lamp"}`} />
      </a>
      <nav aria-label={copy.nav.sections} className="ml-auto flex items-center gap-3 text-[13px] min-[400px]:gap-4 min-[400px]:text-sm wide:gap-7 wide:text-[15px]">
        {LINKS.map((id, i) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={active === id ? "location" : undefined}
            style={{ rotate: `${TILT[i]}deg` }}
            className={`group relative font-display font-bold tracking-[0.01em] no-underline [font-stretch:112%] transition-colors ${id === "chi" ? "hidden wide:inline" : ""} ${
              active === id ? (paper ? "text-ink" : "text-light") : soft
            } ${paper ? "hover:text-ink" : "hover:text-light"}`}
          >
            {copy.nav[id]}
            {active === id ? <Circled className={paper ? "text-lamp-ink" : "text-lamp"} /> : <Squiggle className={paper ? "text-lamp-ink" : "text-lamp"} />}
          </a>
        ))}
        <Link
          href={copy.otherLocale.href}
          hrefLang={locale === "it" ? "en" : "it"}
          lang={locale === "it" ? "en" : "it"}
          aria-label={copy.otherLocale.name}
          title={copy.otherLocale.name}
          className="block shrink-0 rotate-6 rounded-[4px] shadow-[0_2px_6px_rgb(0_0_0/0.3)] ring-2 ring-[#fffdf8] transition-transform duration-200 hover:scale-110 hover:rotate-0"
        >
          {locale === "it" ? <FlagUK /> : <FlagIT />}
        </Link>
      </nav>
    </header>
  );
}
