"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Copy } from "@/lib/content/copy";
import type { Locale, Project, SectionId } from "@/lib/content/types";
import type { Room } from "@/lib/scene/room";
import { Logo } from "./doodles";
import { ProjectSheet } from "./project-sheet";
import { Sections } from "./sections";
import { SiteHeader } from "./site-header";

type Props = {
  locale: Locale;
  copy: Copy;
  projects: Project[];
  fonts: { sans: string; mono: string };
};

type SceneStatus = "loading" | "ready" | "unavailable";

const SECTIONS: SectionId[] = ["ciao", "lavori", "stack", "metodo", "chi", "contatti"];
// 0: the room fills the screen, 1: the room sits in a window and the page is paper
const WINDOWED: Record<SectionId, number> = { ciao: 0, lavori: 1, stack: 1, metodo: 1, chi: 1, contatti: 0 };

type Rect = { x: number; y: number; w: number; h: number };
const WIDE = 760;
// desktop: a window on the right, under the header; phone: a band under the header
function windowRect(W: number, H: number): Rect {
  if (W >= WIDE) {
    const pad = Math.min(64, Math.max(16, W * 0.045));
    const x = Math.round(W * 0.56);
    return { x, y: 84, w: W - x - pad, h: H - 84 - pad };
  }
  return { x: 12, y: 60, w: W - 24, h: Math.round(H * 0.3) };
}
const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

export function Portfolio({ locale, copy, projects, fonts }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roomRef = useRef<Room | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<SceneStatus>("loading");
  const [paper, setPaper] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  // the last hovered project stays mounted so its screenshot can fade out
  const [lastPreview, setLastPreview] = useState<number | null>(null);
  const [active, setActive] = useState<SectionId>("ciao");
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);
  // `open` is the project in the sheet; `shown` flips once the camera has reached the book
  const [open, setOpen] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const openTimer = useRef(0);
  const pushedRef = useRef(false);
  const reduceRef = useRef(false);

  // ---------- project sheet ----------
  const showProject = useCallback((i: number, how: "push" | "replace" | "none") => {
    const room = roomRef.current;
    const slug = projects[i].slug;
    if (how !== "none") {
      const url = `${location.pathname}?p=${slug}${location.hash}`;
      if (how === "push") {
        history.pushState({ p: slug }, "", url);
        pushedRef.current = true;
      } else history.replaceState({ p: slug }, "", url);
    }
    setOpen(i);
    room?.highlightBook(null);
    room?.focusBook(i);
    clearTimeout(openTimer.current);
    const reveal = () => {
      room?.setBlur(true);
      setShown(true);
    };
    if (shown || !room || reduceRef.current) reveal();
    else {
      room.setBlur(false);
      openTimer.current = window.setTimeout(reveal, 650);
    }
  }, [projects, shown]);

  const hideProject = useCallback(() => {
    clearTimeout(openTimer.current);
    setShown(false);
    setOpen(null);
    roomRef.current?.focusBook(null);
    roomRef.current?.setBlur(false);
  }, []);

  const closeProject = useCallback(() => {
    // undo our own history entry so Back and Close behave the same
    if (pushedRef.current) {
      pushedRef.current = false;
      history.back();
    } else {
      history.replaceState(null, "", `${location.pathname}${location.hash}`);
      hideProject();
    }
  }, [hideProject]);

  const openFromUrl = useCallback(() => {
    const slug = new URLSearchParams(location.search).get("p");
    const i = slug ? projects.findIndex((p) => p.slug === slug) : -1;
    if (i >= 0) showProject(i, "none");
    else hideProject();
  }, [projects, showProject, hideProject]);

  useEffect(() => {
    const onPop = () => {
      pushedRef.current = false;
      openFromUrl();
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, [openFromUrl]);

  // a shared link like /?p=gestionale-eventi opens straight on that project
  const initialOpen = useRef(false);
  useEffect(() => {
    if (initialOpen.current) return;
    initialOpen.current = true;
    openFromUrl();
  }, [openFromUrl]);

  // lock page scroll while a sheet is open
  useEffect(() => {
    document.documentElement.style.overflow = open !== null ? "hidden" : "";
  }, [open]);

  // ---------- scroll to camera ----------
  const sync = useCallback(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)!);
    const y = scrollY + innerHeight * 0.4;
    let i = 0;
    while (i < els.length - 1 && els[i + 1].offsetTop <= y) i++;
    const a = SECTIONS[i];
    const b = SECTIONS[Math.min(i + 1, SECTIONS.length - 1)];
    let k = i < SECTIONS.length - 1 ? smooth(0.55, 1, (y - els[i].offsetTop) / (els[i + 1].offsetTop - els[i].offsetTop)) : 0;
    if (reduceRef.current) k = k > 0.5 ? 1 : 0;
    const now = k > 0.5 ? b : a;
    roomRef.current?.setPose(a, b, k, now);
    setActive(now);

    // shrink the room into its window: clip-path is composited, the scene is not redrawn for it
    const W = innerWidth;
    const H = innerHeight;
    const w = WINDOWED[a] + (WINDOWED[b] - WINDOWED[a]) * k;
    const win = windowRect(W, H);
    const r: Rect = { x: win.x * w, y: win.y * w, w: W + (win.w - W) * w, h: H + (win.h - H) * w };
    // full screen, the room is framed in the top two thirds so the name below does not cover it
    const fh = W >= WIDE ? 0.68 : 0.6;
    roomRef.current?.setFrame({ ...r, h: r.h - (1 - w) * H * (1 - fh) });
    const stage = stageRef.current;
    if (stage) {
      stage.style.clipPath = `inset(${r.y}px ${W - r.x - r.w}px ${H - r.y - r.h}px ${r.x}px round ${14 * w}px)`;
      stage.style.zIndex = w > 0.5 ? "3" : "0";
    }
    if (scrimRef.current) scrimRef.current.style.opacity = String(1 - w);
    // the text fades while the room crosses it, see .on-paper and .on-room
    document.documentElement.style.setProperty("--w", String(w));
    setPaper(w > 0.5);
  }, []);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          sync();
        });
    };
    const onResize = () => {
      roomRef.current?.resize();
      sync();
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    sync();
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [sync]);

  // ---------- the 3D room, loaded after the text is on screen ----------
  const showRef = useRef(showProject);
  useEffect(() => {
    showRef.current = showProject;
  }, [showProject]);
  useEffect(() => {
    reduceRef.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let room: Room | null = null;
    let cancelled = false;
    import("@/lib/scene/room")
      .then(({ createRoom }) => {
        if (cancelled || !canvasRef.current) return;
        room = createRoom({
          canvas: canvasRef.current,
          log: copy.log,
          labels: { ...copy.scene, books: projects.map((p) => p.title) },
          fonts: { mono: fonts.mono },
          reducedMotion: reduceRef.current,
          onHover: setTip,
          onPick: (pick) => {
            if (pick.type === "book") showRef.current(pick.index, "push");
            else document.getElementById(pick.id)?.scrollIntoView({ behavior: reduceRef.current ? "auto" : "smooth" });
          },
        });
        roomRef.current = room;
        sync();
        return room.ready.then(() => {
          if (cancelled) return;
          setStatus("ready");
          sync();
          const slug = new URLSearchParams(location.search).get("p");
          const i = slug ? projects.findIndex((p) => p.slug === slug) : -1;
          if (i >= 0) {
            room!.focusBook(i);
            room!.setBlur(true);
          }
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setStatus("unavailable");
      });
    return () => {
      cancelled = true;
      room?.dispose();
      roomRef.current = null;
    };
  }, [projects, copy, fonts, sync]);

  const sheetOpen = open !== null;

  return (
    <>
      <div ref={stageRef} className="fixed inset-0 z-0 bg-night">
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={`block h-full w-full touch-pan-y transition-opacity duration-700 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
        />
        <div ref={scrimRef} className="scrim pointer-events-none absolute inset-0" />
        {status !== "ready" && (
          <div className="absolute top-[40%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-4 text-center" role="status">
            <Logo className={`h-14 text-lamp ${status === "loading" ? "animate-pulse" : ""}`} />
            <p className="font-mono text-[13px] text-light-soft">{status === "loading" ? copy.loading : copy.noWebgl}</p>
          </div>
        )}
      </div>

      {/* desktop: the project screenshot fades in over the window after the camera reaches the book */}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed top-[84px] right-[var(--pad)] bottom-[var(--pad)] left-[56vw] z-[4] hidden items-center justify-center overflow-hidden rounded-[14px] bg-[rgb(14_16_22/0.62)] p-[6%] transition-opacity wide:flex ${paper && preview !== null && !sheetOpen && projects[preview].shots.length ? "opacity-100 delay-500 duration-300" : "opacity-0 duration-150"}`}
      >
        {lastPreview !== null && projects[lastPreview].shots[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={projects[lastPreview].slug} src={projects[lastPreview].shots[0].src} alt="" className="max-h-full max-w-full object-contain shadow-[0_24px_60px_rgb(0_0_0/0.45)]" />
        )}
      </div>

      {tip && !sheetOpen && (
        <div
          className="pointer-events-none fixed z-[4] translate-x-3.5 translate-y-3.5 whitespace-nowrap bg-light px-2 py-0.5 text-[13px] font-medium text-ink"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.label}
        </div>
      )}

      <SiteHeader copy={copy} locale={locale} active={active === "stack" ? "lavori" : active} paper={paper} inert={sheetOpen} />

      <Sections
        copy={copy}
        projects={projects}
        inert={sheetOpen}
        onOpen={(i) => showProject(i, "push")}
        onHighlight={(i) => {
          setPreview(i);
          if (i !== null) setLastPreview(i);
          const room = roomRef.current;
          if (!room || sheetOpen) return;
          // in the window the camera walks to the book; on phones the book just slides out
          if (paper && innerWidth >= WIDE) room.focusBook(i);
          else room.highlightBook(i);
        }}
        onHighlightMany={(list) => {
          const room = roomRef.current;
          if (!room || sheetOpen) return;
          room.focusBook(null);
          room.highlightBook(list);
        }}
      />

      <div
        className={`fixed inset-0 z-[15] bg-[rgb(14_16_22/0.6)] transition-opacity duration-300 ${shown ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeProject}
        aria-hidden="true"
      />
      <ProjectSheet
        copy={copy}
        projects={projects}
        index={open}
        shown={shown}
        onClose={closeProject}
        onGo={(i) => showProject(i, "replace")}
      />
    </>
  );
}
