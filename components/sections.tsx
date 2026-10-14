"use client";

import Image from "next/image";
import { useState } from "react";
import { SITE, type Copy } from "@/lib/content/copy";
import type { Project, Status } from "@/lib/content/types";
import { Doodle, Marked, Note, Sticker, StickerDefs } from "./doodles";

type Props = {
  copy: Copy;
  projects: Project[];
  inert: boolean;
  onOpen: (index: number) => void;
  onHighlight: (index: number | null) => void;
};

// Paper sections leave the right 44% of a desktop screen to the room's window, and the top 30% of a phone.
// main ignores the pointer so the canvas stays clickable where there is no text.
const paperStep =
  "relative min-h-svh px-[var(--pad)] pt-[calc(60px+30svh+40px)] pb-24 wide:pt-[132px] wide:pb-32 wide:pr-[calc(44vw+48px)]";
const sectionTitle = "mb-5 text-[clamp(1.9rem,2.9vw,2.6rem)] font-extrabold leading-tight tracking-[-0.01em]";
const prose = "max-w-[60ch] text-[17px] leading-[1.65] wide:text-lg";

export function Sections({ copy, projects, inert, onOpen, onHighlight }: Props) {
  return (
    <main inert={inert} className="pointer-events-none relative z-[2] text-base leading-[1.55]">
      <StickerDefs />

      {/* ---------- arrival: the room fills the screen, a few lines sit in its corner ---------- */}
      <section id="ciao" className="flex min-h-svh flex-col justify-end px-[var(--pad)] pt-24 pb-[calc(32px+env(safe-area-inset-bottom,0px))] text-light wide:pb-14">
        <div className="pointer-events-auto max-w-[34rem]">
          <p className="mb-9 ml-12 max-w-[24rem]">
            <Note className="!text-lamp">
              <span className="wide:hidden">{copy.ciao.hint.touch}</span>
              <span className="hidden wide:inline">{copy.ciao.hint.wide}</span>
            </Note>
          </p>
          <h1 className="text-[clamp(1.9rem,3.4vw,2.9rem)] font-extrabold leading-tight tracking-[-0.01em]">{copy.ciao.name}</h1>
          <p className="mt-3 text-lg text-light/90">
            {copy.ciao.role} {copy.ciao.lead}
          </p>
        </div>
      </section>

      {/* ---------- work: the index of the books on the shelf ---------- */}
      <section id="lavori" className={paperStep}>
        <div className="pointer-events-auto">
          <h2 className={sectionTitle}>{copy.lavori.title}</h2>
          <p className={`${prose} text-ink-soft`}>
            {copy.lavori.lead} <span className="hidden wide:inline">{copy.lavori.hint}</span>
          </p>

          {(["client", "mine"] as const).map((owner) => (
            <div key={owner} className="mt-12">
              <div className="mb-3 flex flex-wrap items-baseline gap-x-14 gap-y-3">
                <h3 className="text-xl font-extrabold">{copy.owners[owner]}</h3>
                <Note arrow="left" className="ml-14 wide:ml-0">
                  {copy.ownerNotes[owner]}
                </Note>
              </div>
              <ul className="border-t-2 border-ink" onPointerLeave={() => onHighlight(null)}>
                {projects.map((p, i) =>
                  p.owner !== owner ? null : (
                    <li key={p.slug} className="border-b border-rule">
                      <button
                        type="button"
                        onClick={() => onOpen(i)}
                        onPointerEnter={() => onHighlight(i)}
                        onFocus={() => onHighlight(i)}
                        onBlur={() => onHighlight(null)}
                        style={{ "--c": p.color } as React.CSSProperties}
                        className="group relative flex w-full cursor-pointer items-center gap-4 py-3.5 pl-4 text-left"
                      >
                        <span aria-hidden="true" className="absolute top-4 bottom-4 left-0 w-[3px] bg-[var(--c)] opacity-35 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-[0.2em] wide:text-lg">{p.title}</span>
                          <span className="mt-0.5 block text-sm text-ink-soft">
                            <StatusLabel copy={copy} status={p.status} />, {p.client}, {p.year}
                          </span>
                        </span>
                        <Thumb project={p} tilt={i % 2 ? 2.5 : -2} soon={copy.soon} />
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
          <p className="mt-6 text-sm text-ink-soft">{copy.statusNote}</p>
        </div>
      </section>

      {/* ---------- process: five steps, each with a doodle ---------- */}
      <section id="metodo" className={paperStep}>
        <div className="pointer-events-auto">
          <h2 className={sectionTitle}>{copy.metodo.title}</h2>
          <ol className="mt-8 max-w-[62ch]">
            {copy.metodo.steps.map((step) => (
              <li
                key={step.title}
                className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 wide:grid-cols-[56px_minmax(0,1fr)] wide:gap-x-5 [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:top-14 [&:not(:last-child)]:before:bottom-2 [&:not(:last-child)]:before:left-[21px] [&:not(:last-child)]:before:border-l-2 [&:not(:last-child)]:before:border-dashed [&:not(:last-child)]:before:border-ink/25 wide:[&:not(:last-child)]:before:top-16 wide:[&:not(:last-child)]:before:left-[27px]"
              >
                <Doodle name={step.icon} className="size-11 wide:size-14" />
                <div>
                  <h3 className="mt-1 text-lg font-bold leading-snug wide:mt-2 wide:text-xl">{step.title}</h3>
                  <p className="mt-1.5 text-[17px] leading-[1.65] wide:text-lg">
                    <Marked text={step.text} />
                  </p>
                  {step.note && (
                    <p className="mt-6 ml-14">
                      <Note>{step.note}</Note>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- about ---------- */}
      <section id="chi" className={paperStep}>
        <div className="pointer-events-auto">
          <h2 className={sectionTitle}>{copy.chi.title}</h2>
          <div className={prose}>
            {copy.chi.body.map((para) => (
              <div key={para.text} className="mb-5">
                {para.sticker && <Sticker name={para.sticker} tilt={8} className="float-right -mt-3 ml-4" />}
                <p>
                  <Marked text={para.text} />
                </p>
                {para.note && (
                  <p className="mt-6 mb-2 ml-14">
                    <Note>{para.note}</Note>
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="mt-10">
            <Note arrow="down" className="rotate-1">
              {copy.chi.stickersNote}
            </Note>
          </p>
          <ul className="mt-12 grid max-w-[36rem] grid-cols-3 gap-x-3 gap-y-6 wide:grid-cols-6">
            {copy.chi.stickers.map((st, i) => (
              <li key={st.name} className={i % 2 ? "translate-y-3" : ""}>
                <Sticker name={st.name} label={st.label} tilt={[-8, 6, -4, 9, -7, 4][i % 6]} big />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- contact: the room opens up again ---------- */}
      <section id="contatti" className="flex min-h-svh flex-col justify-end px-[var(--pad)] pt-24 pb-[calc(32px+env(safe-area-inset-bottom,0px))] text-light wide:pb-14">
        <div className="pointer-events-auto max-w-[40rem]">
          <h2 className={sectionTitle}>{copy.contatti.title}</h2>
          <p className="text-lg text-light/90">{copy.contatti.lead}</p>
          <Email copy={copy} />
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <a href={`mailto:${SITE.email}?subject=${encodeURIComponent(copy.contatti.callSubject)}`} className="underline underline-offset-[0.22em] hover:text-lamp">
              {copy.contatti.call}
            </a>
            <a href={SITE.github} className="underline underline-offset-[0.22em] hover:text-lamp">
              GitHub
            </a>
            <a href={SITE.linkedin} className="underline underline-offset-[0.22em] hover:text-lamp">
              LinkedIn
            </a>
          </p>
          <p className="mt-10 text-xs text-light-soft">{copy.contatti.credits}</p>
        </div>
      </section>
    </main>
  );
}

// one colour per status, so the list can be scanned at a glance
const STATUS_DOT: Record<Status, string> = {
  production: "bg-[#3f8f5a]",
  delivered: "bg-ink-soft",
  development: "bg-lamp-ink",
  demo: "bg-[#4e6e8e]",
};

export function StatusLabel({ copy, status }: { copy: Copy; status: Status }) {
  return (
    <span className="whitespace-nowrap text-ink">
      <span aria-hidden="true" className={`mr-1.5 inline-block size-[7px] -translate-y-px rounded-full ${STATUS_DOT[status]}`} />
      {copy.status[status]}
    </span>
  );
}

// the first screenshot as a small print stuck next to the title; a handwritten tag when there is none yet
function Thumb({ project, tilt, soon }: { project: Project; tilt: number; soon: string }) {
  const shot = project.shots[0];
  return (
    <span
      aria-hidden="true"
      style={{ transform: `rotate(${tilt}deg)` }}
      className="hidden h-[54px] w-[84px] shrink-0 items-center justify-center overflow-hidden border-[3px] border-white bg-paper shadow-[0_3px_10px_rgb(26_29_37/0.22)] transition-transform duration-200 group-hover:!rotate-0 group-hover:scale-110 min-[420px]:flex wide:h-[62px] wide:w-[96px]"
    >
      {shot ? (
        <Image src={shot.src} alt="" width={192} height={124} sizes="96px" className="h-full w-full object-cover object-top" />
      ) : (
        <span className="font-hand px-1 text-center text-[13px] leading-tight text-lamp-ink">{soon}</span>
      )}
    </span>
  );
}

function Email({ copy }: { copy: Copy }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <a href={`mailto:${SITE.email}`} className="text-[clamp(1.25rem,2.2vw,1.75rem)] font-semibold break-all underline underline-offset-[0.2em] hover:text-lamp">
        {SITE.email}
      </a>
      <button
        type="button"
        className="cursor-pointer text-sm text-light-soft underline underline-offset-[0.22em] hover:text-lamp"
        onClick={() =>
          navigator.clipboard
            ?.writeText(SITE.email)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            })
            .catch(() => {})
        }
      >
        <span aria-live="polite">{copied ? copy.contatti.copied : copy.contatti.copy}</span>
      </button>
    </p>
  );
}
