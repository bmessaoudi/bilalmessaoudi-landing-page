"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Copy } from "@/lib/content/copy";
import type { Project } from "@/lib/content/types";
import { StatusLabel } from "./sections";

type Props = {
  copy: Copy;
  projects: Project[];
  index: number | null;
  shown: boolean;
  onClose: () => void;
  onGo: (index: number) => void;
};

export function ProjectSheet({ copy, projects, index, shown, onClose, onGo }: Props) {
  // keep the last project on screen while the sheet slides away
  const [kept, setKept] = useState(index);
  if (index !== null && index !== kept) setKept(index);

  const closeRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  const n = projects.length;
  const i = kept ?? 0;
  const p = projects[i];
  const prev = (i + n - 1) % n;
  const next = (i + 1) % n;

  useEffect(() => {
    if (shown) {
      openerRef.current = document.activeElement;
      closeRef.current?.focus({ preventScroll: true });
    } else if (openerRef.current instanceof HTMLElement) {
      openerRef.current.focus({ preventScroll: true });
      openerRef.current = null;
    }
  }, [shown]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [kept]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onGo(next);
      else if (e.key === "ArrowLeft") onGo(prev);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [shown, onClose, onGo, next, prev]);

  const nav = "cursor-pointer px-2 py-1 text-lg leading-none hover:text-lamp-ink";

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      inert={!shown}
      data-open={shown}
      style={{ borderColor: p.color }}
      className="sheet fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+24px)] bottom-0 z-20 flex flex-col border-t-[10px] bg-paper text-ink wide:top-0 wide:left-auto wide:w-[min(780px,100%)] wide:border-t-0 wide:border-l-[12px]"
    >
      <div className="flex items-center gap-2 border-b border-rule px-[clamp(18px,5vw,56px)] py-3 text-sm">
        <span className="text-ink-soft">
          {p.tag}, {i + 1} {copy.sheet.of} {n}
        </span>
        <button type="button" className={`${nav} ml-auto`} onClick={() => onGo(prev)} aria-label={`${copy.sheet.prev}: ${projects[prev].title}`}>
          ←
        </button>
        <button type="button" className={nav} onClick={() => onGo(next)} aria-label={`${copy.sheet.next}: ${projects[next].title}`}>
          →
        </button>
        <button ref={closeRef} type="button" onClick={onClose} className="ml-3 cursor-pointer font-semibold underline underline-offset-[0.22em] hover:text-lamp-ink">
          {copy.sheet.close}
        </button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[clamp(18px,5vw,56px)] pt-10 pb-[calc(48px+env(safe-area-inset-bottom,0px))]">
        <h2 id="sheet-title" className="mb-3 max-w-[16ch] text-[clamp(2rem,4.4vw,3.2rem)] font-[750] leading-[1.04] tracking-[-0.025em]">
          {p.title}
        </h2>
        <p className="mb-7 text-[15px] text-ink-soft">
          <StatusLabel copy={copy} status={p.status} />, {copy.owner[p.owner].toLowerCase()}, {p.year}
          <br />
          {p.who}
        </p>

        {p.body.map((t) => (
          <p key={t} className="mb-4 max-w-[60ch] leading-[1.6]">
            {t}
          </p>
        ))}

        <dl className="my-8 grid grid-cols-[5.5em_minmax(0,1fr)] wide:grid-cols-[7.5em_minmax(0,1fr)] gap-x-5 gap-y-2 border-y border-rule py-4 text-[15px]">
          {p.facts.map((f) => (
            <div key={f.label} className="contents">
              <dt className="text-ink-soft">{f.label}</dt>
              <dd>{f.todo ? <span className="border-b border-dashed border-lamp-ink text-lamp-ink">{f.value}</span> : f.value}</dd>
            </div>
          ))}
        </dl>

        {p.shots.length > 0 ? (
          p.shots.map((s) => (
            <figure key={s.src} className="mb-8">
              <Image
                src={s.src}
                width={s.width}
                height={s.height}
                alt={s.caption}
                sizes="(min-width: 760px) 700px, 100vw"
                className={`block h-auto w-full border border-rule ${s.height > s.width ? "aspect-[16/11] object-cover object-top" : ""}`}
              />
              <figcaption className="mt-2 text-[13px] text-ink-soft">{s.caption}</figcaption>
            </figure>
          ))
        ) : (
          <p className="border border-dashed border-rule px-5 py-10 text-center text-sm text-ink-soft">{copy.sheet.noShots}</p>
        )}

        <div className="mt-10 grid grid-cols-2 gap-4 border-t border-rule pt-5 text-[15px]">
          <button type="button" className="cursor-pointer text-left hover:text-lamp-ink" onClick={() => onGo(prev)}>
            <small className="block text-ink-soft">← {copy.sheet.prev}</small>
            {projects[prev].title}
          </button>
          <button type="button" className="cursor-pointer text-right hover:text-lamp-ink" onClick={() => onGo(next)}>
            <small className="block text-ink-soft">{copy.sheet.next} →</small>
            {projects[next].title}
          </button>
        </div>
        <p className="mt-8 hidden text-xs text-ink-soft wide:block">{copy.sheet.keys}</p>
      </div>
    </aside>
  );
}
