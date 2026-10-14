import type { ReactNode } from "react";

// Hand-drawn bits for the paper sections: line icons, die-cut stickers, notes with an arrow,
// and a tiny **marker** syntax for the copy. Everything is inline SVG, no image requests.

/** Renders copy where **words** get a marker stroke. */
export function Marked({ text }: { text: string }) {
  return text.split("**").map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

// ---------------------------------------------------------------- notes

type ArrowDir = "up" | "left" | "down";

const ARROWS: Record<ArrowDir, { box: string; path: string; head: string; className: string }> = {
  // from the note up to the line above
  up: { box: "0 0 46 42", path: "M42 38C30 33 14 27 9 7", head: "M3 14 9 5l7 7", className: "-top-7 -left-12 h-[42px] w-[46px]" },
  // from the note back to something on its left
  left: { box: "0 0 56 30", path: "M54 18C40 26 22 24 8 13", head: "M15 7 7 13l9 5", className: "top-0 -left-[60px] h-[30px] w-[56px]" },
  // from the note down to what follows
  down: { box: "0 0 40 46", path: "M6 4c18 4 26 18 24 36", head: "M23 34l7 8 6-9", className: "-bottom-11 left-6 h-[46px] w-[40px]" },
};

/** A handwritten aside in the lamp colour, with a drawn arrow pointing at what it talks about. */
export function Note({ children, arrow = "up", className = "" }: { children: ReactNode; arrow?: ArrowDir; className?: string }) {
  const a = ARROWS[arrow];
  return (
    <span className={`font-hand relative inline-block -rotate-2 text-[17px] leading-snug text-lamp-ink wide:text-lg ${className}`}>
      <svg aria-hidden="true" viewBox={a.box} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`absolute ${a.className}`}>
        <path d={a.path} />
        <path d={a.head} />
      </svg>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- line icons for the process

export type IconName = "search" | "plan" | "code" | "check" | "dashboard";

const ICONS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="21" cy="21" r="11.5" />
      <path d="M29.5 29.8 39 39.5" strokeWidth="3.4" />
      <path d="M15.5 17.5c1.5-2.6 4-3.8 6.8-3.6" />
    </>
  ),
  plan: (
    <>
      <path d="M9 7.5h22.5l6 6V40.5H9z" />
      <path d="M31.5 7.5v6h6" />
      <path d="M15 20h15M15 26.5h15M15 33h9" />
    </>
  ),
  code: (
    <>
      <rect x="5.5" y="9" width="37" height="25" rx="3" />
      <path d="M2.5 39.5h43" />
      <path d="m17 17-5 4.5 5 4.5M31 17l5 4.5-5 4.5M26 15.5l-4 12" />
    </>
  ),
  check: (
    <>
      <rect x="7.5" y="6.5" width="33" height="35" rx="4" />
      <path d="m15 24 6.5 6.5L34 16" strokeWidth="3.2" />
    </>
  ),
  dashboard: (
    <>
      <rect x="5" y="7" width="38" height="33" rx="3.5" />
      <path d="M5 15h38" />
      <path d="M12 33v-6M19 33v-11M26 33v-8M33 33V20" strokeWidth="3" />
    </>
  ),
};

/** A doodled line icon sitting on a soft lamp-coloured blob. */
export function Doodle({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={`shrink-0 ${className}`}>
      <path d="M8 14C11 4 30 1 40 9s7 27-4 32-27 3-30-8 0-13 2-19Z" fill="rgb(255 190 115 / 0.5)" />
      <g fill="none" stroke="var(--color-ink)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------- stickers

export type StickerName = "basket" | "controller" | "film" | "plane" | "pizza" | "chart" | "pin";

const STICKERS: Record<StickerName, ReactNode> = {
  basket: (
    <>
      <circle cx="32" cy="32" r="22" fill="#e0782f" />
      <g fill="none" stroke="#3a2416" strokeWidth="2.4">
        <path d="M10 32h44M32 10v44" />
        <path d="M17 15c8 6 8 28 0 34M47 15c-8 6-8 28 0 34" />
      </g>
    </>
  ),
  controller: (
    <>
      <path d="M14 22h36c6 0 9 6 10 14 1.5 9-1 14-5 14-5 0-6-8-12-8H23c-6 0-7 8-12 8-4 0-6.5-5-5-14 1-8 4-14 8-14Z" fill="#30364a" />
      <path d="M19 30v8M15 34h8" stroke="#f2f0eb" strokeWidth="3" strokeLinecap="round" />
      <circle cx="43" cy="31" r="2.6" fill="#ffbe73" />
      <circle cx="49" cy="36" r="2.6" fill="#7fa58d" />
    </>
  ),
  film: (
    <>
      <rect x="10" y="24" width="44" height="28" rx="2" fill="#23262e" />
      <path d="m9 15 42-9 2 9-42 9z" fill="#23262e" />
      <path d="m16 13.5 5 8.5M26 11.5l5 8.5M36 9l5 8.5M46 7l4 8" stroke="#f2f0eb" strokeWidth="3" />
      <path d="M10 33h44" stroke="#f2f0eb" strokeWidth="1.5" opacity="0.5" />
      <path d="m28 37 10 5-10 5z" fill="#ffbe73" />
    </>
  ),
  plane: (
    <>
      <path d="M6 30 56 10 44 54 32 38z" fill="#5a8fc7" />
      <path d="M32 38 56 10 24 34l2 14z" fill="#3e6d9e" />
    </>
  ),
  pizza: (
    <>
      <path d="M8 16c15-8 33-8 48 0L32 58z" fill="#f2c25c" />
      <path d="M8 16c15-8 33-8 48 0l-2.5 5c-13-6.5-30-6.5-43 0z" fill="#c9852f" />
      <circle cx="25" cy="27" r="4" fill="#c8483a" />
      <circle cx="39" cy="28" r="3.6" fill="#c8483a" />
      <circle cx="32" cy="41" r="3.4" fill="#c8483a" />
    </>
  ),
  chart: (
    <>
      <rect x="8" y="10" width="48" height="44" rx="5" fill="#f7f6f2" />
      <path d="m15 44 10-11 8 6 14-17" fill="none" stroke="#3f8f5a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M40 20h8v8" fill="none" stroke="#3f8f5a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  pin: (
    <>
      <path d="M32 58C22 44 14 35 14 25a18 18 0 0 1 36 0c0 10-8 19-18 33Z" fill="#c8634f" />
      <circle cx="32" cy="25" r="7" fill="#f7f6f2" />
    </>
  ),
};

/** A die-cut sticker: white border and a soft shadow come from the shared filter in <StickerDefs />. */
export function Sticker({ name, label, tilt = 0, big = false, className = "" }: { name: StickerName; label?: string; tilt?: number; big?: boolean; className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center gap-1 ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <svg role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true} viewBox="0 0 64 64" className={`overflow-visible transition-transform duration-200 hover:scale-110 hover:-rotate-6 ${big ? "size-16 wide:size-[72px]" : "size-12 wide:size-14"}`}>
        <g filter="url(#sticker)">{STICKERS[name]}</g>
      </svg>
      {label && <span className="font-hand text-sm text-ink-soft">{label}</span>}
    </span>
  );
}

export function StickerDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <filter id="sticker" x="-25%" y="-25%" width="150%" height="150%">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3.2" result="grow" />
        <feFlood floodColor="#fffdf8" />
        <feComposite in2="grow" operator="in" result="border" />
        <feGaussianBlur in="grow" stdDeviation="1.6" result="blur" />
        <feOffset in="blur" dx="1" dy="2.2" result="drop" />
        <feFlood floodColor="rgb(26 29 37 / 0.28)" />
        <feComposite in2="drop" operator="in" result="shadow" />
        <feMerge>
          <feMergeNode in="shadow" />
          <feMergeNode in="border" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
  );
}

// ---------------------------------------------------------------- logo

/** The devbybil signature. One SVG used as a mask, so it takes the colour of the text around it. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="devbybil"
      className={`inline-block aspect-[3.216] bg-current align-middle [mask:url(/brand/devbybil.svg)_center/contain_no-repeat] ${className}`}
    />
  );
}
