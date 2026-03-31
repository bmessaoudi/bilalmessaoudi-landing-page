export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
}

export function isLowEnd(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { hardwareConcurrency?: number; deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 4) <= 2 || (nav.deviceMemory ?? 4) < 4;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
