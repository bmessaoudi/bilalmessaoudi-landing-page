import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { LogLine, SectionId } from "@/lib/content/types";

/**
 * The 3D room behind the page. The room is built, lit and baked in Blender (blender/room.py),
 * so here every surface is an unlit texture: no lights, no shadows, the same look on every device.
 * Rendered on demand: a frame is drawn only while the camera, a book, Clawd or the monitor log is moving.
 */

export type Frame = { x: number; y: number; w: number; h: number };

export type RoomPick = { type: "book"; index: number } | { type: "section"; id: SectionId };

export type RoomOptions = {
  canvas: HTMLCanvasElement;
  log: LogLine[];
  labels: { monitor: string; robot: string; moka: string; phone: string; ball: string; shield: string; map: string; pad: string; posters: string; ironman: string; books: string[] };
  fonts: { mono: string };
  reducedMotion: boolean;
  onHover: (hit: { label: string; x: number; y: number } | null) => void;
  onPick: (pick: RoomPick) => void;
};

export type Room = {
  ready: Promise<void>;
  /** Camera between two section poses, k in 0..1. */
  setPose: (from: SectionId, to: SectionId, k: number, active: SectionId) => void;
  /** The part of the screen the room is visible in (CSS px). The camera frames the room inside it. */
  setFrame: (frame: Frame) => void;
  /** Pull one book out slightly (index hover), several (a technology), or reset with null. */
  highlightBook: (index: number | number[] | null) => void;
  /** Move the camera to a book, or back to the scroll pose with null. */
  focusBook: (index: number | null) => void;
  /** Turn the camera to the whole bookshelf (a technology is picked), or back to the scroll pose. */
  lookAtShelf: (on: boolean) => void;
  /** Low resolution render that reads as a blur behind an open sheet; rendering stops meanwhile. */
  setBlur: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

type Pose = { p: [number, number, number]; t: [number, number, number] };
const POSES: Record<SectionId, Pose> = {
  ciao: { p: [1.55, 1.75, 3.35], t: [0.4, 0.88, -0.3] },
  lavori: { p: [0.62, 1.12, 2.15], t: [1.3, 0.98, -0.45] },
  // the technology posters over the desk; picking a technology turns the camera to the shelf
  stack: { p: [-0.5, 1.62, 1.55], t: [-0.84, 1.72, -0.62] },
  metodo: { p: [0.1, 1.45, 0.72], t: [-0.3, 0.98, -0.4] },
  chi: { p: [0.55, 1.05, 0.55], t: [0.2, 0.86, -0.3] },
  contatti: { p: [-0.25, 1.9, 2.2], t: [-0.4, 0.9, -0.2] },
};

type Target = { root: THREE.Object3D; label: string; book?: number; go?: SectionId; clawd?: boolean };

export function createRoom(opts: RoomOptions): Room {
  const { canvas, reducedMotion: reduce } = opts;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const small = coarse || innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // the textures already went through Blender's view transform
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#1B1F29");
  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 30);
  let disposed = false;

  const books: THREE.Object3D[] = [];
  const bookState: { z0: number; out: number; want: number }[] = [];
  const targets: Target[] = [];

  // monitor log
  let screenCanvas: HTMLCanvasElement | null = null;
  let screenTex: THREE.CanvasTexture | null = null;
  let logShown = 0;
  let logTimer = 0;
  function drawScreen(n: number) {
    if (!screenCanvas || !screenTex) return;
    logShown = n;
    const g = screenCanvas.getContext("2d")!;
    const W = screenCanvas.width;
    const H = screenCanvas.height;
    g.fillStyle = "#12151C";
    g.fillRect(0, 0, W, H);
    g.font = `400 30px ${opts.fonts.mono}`;
    g.textBaseline = "top";
    const lh = 42;
    const rows = Math.floor((H - 100) / lh);
    const start = Math.max(0, n - rows);
    opts.log.slice(start, n).forEach(({ kind, text }, i) => {
      g.fillStyle = kind === ">" ? "#FFBE73" : kind === "$" ? "#8FA3C7" : "#9AA0AE";
      g.fillText(kind, 36, 30 + i * lh);
      g.fillStyle = kind === ">" ? "#FFBE73" : "#E3E1DC";
      g.fillText(text, 76, 30 + i * lh);
    });
    if (n < opts.log.length) {
      g.fillStyle = "#FFBE73";
      g.fillRect(76, 30 + (n - start) * lh + 4, 16, 32);
    }
    screenTex.needsUpdate = true;
  }

  // Clawd: a small idle loop while you look at the desk, a wave when you point at it
  const clawd = {
    root: null as THREE.Object3D | null,
    eyes: null as THREE.Object3D | null,
    armL: null as THREE.Object3D | null,
    armR: null as THREE.Object3D | null,
    y0: 0,
    t: 0,
    wave: 0,
    blink: 2.5,
  };
  function wave() {
    if (reduce || clawd.wave > 0) return;
    clawd.wave = 1.4;
    invalidate();
  }
  function animateClawd(dt: number) {
    const { root, eyes, armL, armR } = clawd;
    if (!root || !eyes || !armL || !armR) return;
    clawd.t += dt;
    const t = clawd.t;
    // breathing
    root.position.y = clawd.y0 + Math.max(0, Math.sin(t * 2.2)) * 0.002;
    // blink every few seconds
    clawd.blink -= dt;
    if (clawd.blink < 0) clawd.blink = 2.5 + Math.random() * 3;
    eyes.scale.y = clawd.blink < 0.12 ? 0.15 : 1;
    // wave: a little hop, then the right arm goes up and down
    if (clawd.wave > 0) {
      clawd.wave = Math.max(0, clawd.wave - dt);
      const k = 1.4 - clawd.wave;
      root.position.y += Math.max(0, Math.sin(Math.min(1, k / 0.35) * Math.PI)) * 0.025;
      armR.rotation.z = Math.sin(k * 14) * 0.45 + 0.6 * Math.min(1, k * 4) * Math.min(1, clawd.wave * 4);
      armL.rotation.z = -0.15 * Math.sin(k * 7) * Math.min(1, clawd.wave * 4);
    } else {
      armR.rotation.z = Math.sin(t * 1.3) * 0.06;
      armL.rotation.z = -Math.sin(t * 1.3 + 0.8) * 0.06;
    }
  }

  async function build() {
    const fontsReady = Promise.race([document.fonts.load(`400 24px ${opts.fonts.mono}`), new Promise((r) => setTimeout(r, 2500))]);
    const draco = new DRACOLoader().setDecoderPath("/draco/");
    const loader = new GLTFLoader().setDRACOLoader(draco);
    const gltf = await loader.loadAsync(small ? "/models/room-mobile.glb" : "/models/room.glb");
    draco.dispose();
    await fontsReady;
    if (disposed) return;
    const room = gltf.scene;

    // baked atlases become plain textures; materials are shared per atlas
    const swapped = new Map<THREE.Material, THREE.Material>();
    room.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const src = o.material as THREE.MeshStandardMaterial;
      let m = swapped.get(src);
      if (!m) {
        m = src.map
          ? new THREE.MeshBasicMaterial({ map: src.map })
          : new THREE.MeshBasicMaterial({ color: o.name === "lamp_bulb" ? "#FFE7C8" : "#12151C" });
        if (src.map) src.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
        swapped.set(src, m);
        src.dispose();
      }
      o.material = m;
    });
    scene.add(room);

    // monitor screen: a canvas laid on the plane Blender left for it
    const screen = room.getObjectByName("screen") as THREE.Mesh;
    const size = new THREE.Box3().setFromObject(screen).getSize(new THREE.Vector3());
    screenCanvas = document.createElement("canvas");
    screenCanvas.width = 1024;
    screenCanvas.height = Math.round((1024 * size.y) / size.x);
    screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = 4;
    // glTF UVs start at the top, like the canvas
    screenTex.flipY = false;
    screen.material = new THREE.MeshBasicMaterial({ map: screenTex });
    drawScreen(reduce ? opts.log.length : 0);

    opts.labels.books.forEach((label, i) => {
      const b = room.getObjectByName(`book_${String(i).padStart(2, "0")}`);
      if (!b) return;
      books[i] = b;
      bookState[i] = { z0: b.position.z, out: 0, want: 0 };
      targets.push({ root: b, label, book: i });
    });

    clawd.root = room.getObjectByName("clawd") ?? null;
    clawd.eyes = room.getObjectByName("clawd_eyes") ?? null;
    clawd.armL = room.getObjectByName("clawd_arm_l") ?? null;
    clawd.armR = room.getObjectByName("clawd_arm_r") ?? null;
    clawd.y0 = clawd.root?.position.y ?? 0;

    const named = (n: string) => room.getObjectByName(n);
    const add = (n: string, t: Omit<Target, "root">) => {
      const root = named(n);
      if (root) targets.push({ root, ...t });
    };
    add("monitor", { label: opts.labels.monitor, go: "metodo" });
    add("screen", { label: opts.labels.monitor, go: "metodo" });
    add("clawd", { label: opts.labels.robot, go: "metodo", clawd: true });
    add("moka", { label: opts.labels.moka, go: "chi" });
    add("phone", { label: opts.labels.phone, go: "contatti" });
    // the hobbies around the room lead to the about section
    add("basketball", { label: opts.labels.ball, go: "chi" });
    add("shield", { label: opts.labels.shield, go: "chi" });
    add("world_map", { label: opts.labels.map, go: "chi" });
    add("map_frame", { label: opts.labels.map, go: "chi" });
    add("controller", { label: opts.labels.pad, go: "chi" });
    add("arc_reactor", { label: opts.labels.ironman, go: "chi" });
    for (const p of ["poster_main", "poster_b", "poster_c"]) {
      add(p, { label: opts.labels.posters, go: "stack" });
      add(`${p}_frame`, { label: opts.labels.posters, go: "stack" });
    }

    built = true;
    last = performance.now();
    resize();
  }

  // ---------- camera ----------
  let W = 0;
  let H = 0;
  let view: Frame = { x: 0, y: 0, w: innerWidth, h: innerHeight };
  // 0 for a wide frame, 1 for a tall one; drives field of view and camera distance smoothly
  let tall = 0;
  const cur = { p: new THREE.Vector3(...POSES.ciao.p), t: new THREE.Vector3(...POSES.ciao.t) };
  const want = { p: cur.p.clone(), t: cur.t.clone() };
  let override: { p: THREE.Vector3; t: THREE.Vector3 } | null = null;
  // a softer override under the book one: the whole shelf while a technology is picked
  let shelf: { p: THREE.Vector3; t: THREE.Vector3 } | null = null;
  let active: SectionId = "ciao";
  let blurred = false;

  function poseOf(id: SectionId) {
    const P = POSES[id];
    const p = new THREE.Vector3(...P.p);
    const t = new THREE.Vector3(...P.t);
    const far = id === "ciao" || id === "contatti" ? 0.12 : 0.35;
    p.sub(t).multiplyScalar(1 + far * tall).add(t);
    return { p, t };
  }

  const baseDpr = () => Math.min(devicePixelRatio, coarse ? 1.5 : 2);
  function resize() {
    W = innerWidth;
    H = innerHeight;
    renderer.setPixelRatio(blurred ? 0.12 : baseDpr());
    renderer.setSize(W, H, false);
    applyFrame();
  }

  // The camera is set up as if the frame were the whole viewport, then the view is widened to the
  // full canvas. Whatever lies outside the frame is hidden by the page's clip-path.
  function applyFrame() {
    const fw = Math.max(1, view.w);
    const fh = Math.max(1, view.h);
    const aspect = fw / fh;
    tall = Math.min(1, Math.max(0, (1.3 - aspect) / 0.6));
    camera.aspect = aspect;
    camera.fov = 38 + 14 * tall;
    camera.setViewOffset(fw, fh, -view.x, -view.y, W, H);
    camera.updateProjectionMatrix();
    invalidate();
  }

  function bookPose(i: number) {
    const wp = books[i].getWorldPosition(new THREE.Vector3());
    const d = 0.7 + 0.35 * tall;
    return { p: new THREE.Vector3(wp.x - 0.08, wp.y + 0.06, wp.z + d), t: wp };
  }

  // ---------- pointer ----------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered: Target | null = null;
  function pick(x: number, y: number) {
    ndc.set((x / W) * 2 - 1, -(y / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(
      targets.map((t) => t.root),
      true,
    )[0];
    if (!hit) return null;
    return (
      targets.find((t) => {
        let o: THREE.Object3D | null = hit.object;
        while (o) {
          if (o === t.root) return true;
          o = o.parent;
        }
        return false;
      }) ?? null
    );
  }
  let highlighted: number[] = [];
  let focused: number | null = null;
  const syncBooks = () =>
    bookState.forEach((s, i) => {
      if (s) s.want = (focused !== null ? focused === i : hovered?.book !== undefined ? hovered.book === i : highlighted.includes(i)) ? 1 : 0;
    });

  const onMove = (e: PointerEvent) => {
    if (blurred || e.pointerType === "touch") return;
    const h = pick(e.clientX, e.clientY);
    if (h !== hovered) {
      hovered = h;
      canvas.style.cursor = h ? "pointer" : "";
      syncBooks();
      if (h?.clawd) wave();
      invalidate();
    }
    opts.onHover(h ? { label: h.label, x: e.clientX, y: e.clientY } : null);
  };
  const onLeave = () => {
    hovered = null;
    syncBooks();
    opts.onHover(null);
    invalidate();
  };
  const onClick = (e: MouseEvent) => {
    if (blurred) return;
    const h = pick(e.clientX, e.clientY);
    if (!h) return;
    opts.onHover(null);
    if (h.clawd) wave();
    if (h.book !== undefined) opts.onPick({ type: "book", index: h.book });
    else if (h.go) opts.onPick({ type: "section", id: h.go });
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("click", onClick);

  // ---------- render on demand ----------
  let raf = 0;
  let last = performance.now();
  let intro = 0;
  let built = false;
  function invalidate() {
    if (!raf && !disposed) raf = requestAnimationFrame(frame);
  }
  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    let busy = false;

    // arrival: the monitor wakes a moment after the room appears
    if (intro < 1 && built && !reduce) {
      intro = Math.min(1, intro + dt / 1.2);
      if (intro === 1 && logShown === 0) drawScreen(1);
      busy = true;
    }

    const goal = override ?? shelf ?? want;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 5);
    cur.p.lerp(goal.p, k);
    cur.t.lerp(goal.t, k);
    if (cur.p.distanceToSquared(goal.p) > 1e-7 || cur.t.distanceToSquared(goal.t) > 1e-7) busy = true;
    camera.position.copy(cur.p);
    camera.lookAt(cur.t);

    const kb = reduce ? 1 : 1 - Math.exp(-dt * 10);
    books.forEach((b, i) => {
      const s = bookState[i];
      if (!b || !s) return;
      s.out += (s.want - s.out) * kb;
      if (Math.abs(s.want - s.out) > 0.002) busy = true;
      b.position.z = s.z0 + s.out * 0.09;
    });

    // Clawd only moves while you are looking at the desk, or waving at you
    if (built && !reduce && !blurred && (active === "metodo" || active === "chi" || hovered?.clawd || clawd.wave > 0)) {
      animateClawd(dt);
      busy = true;
    }

    if (screenTex && active === "metodo" && logShown < opts.log.length && !reduce) {
      logTimer += dt;
      busy = true;
      if (logTimer > 0.45) {
        logTimer = 0;
        drawScreen(logShown + 1);
      }
    }

    renderer.render(scene, camera);
    if (busy && !document.hidden) invalidate();
  }
  const onVisible = () => {
    if (!document.hidden) {
      last = performance.now();
      invalidate();
    }
  };
  document.addEventListener("visibilitychange", onVisible);

  resize();
  const ready = build();

  return {
    ready,
    setFrame(f) {
      if (f.x === view.x && f.y === view.y && f.w === view.w && f.h === view.h) return;
      view = f;
      applyFrame();
    },
    setPose(from, to, k, act) {
      const A = poseOf(from);
      const B = poseOf(to);
      want.p.copy(A.p).lerp(B.p, k);
      want.t.copy(A.t).lerp(B.t, k);
      active = act;
      invalidate();
    },
    highlightBook(i) {
      highlighted = i === null ? [] : typeof i === "number" ? [i] : i;
      syncBooks();
      invalidate();
    },
    focusBook(i) {
      focused = i;
      override = i !== null && books[i] ? bookPose(i) : null;
      syncBooks();
      invalidate();
    },
    lookAtShelf(on) {
      shelf = on ? poseOf("lavori") : null;
      invalidate();
    },
    setBlur(on) {
      blurred = on;
      renderer.setPixelRatio(on ? 0.12 : baseDpr());
      renderer.setSize(W, H, false);
      if (on) {
        hovered = null;
        canvas.style.cursor = "";
      }
      invalidate();
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", onVisible);
      scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          (m as THREE.MeshBasicMaterial).map?.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
