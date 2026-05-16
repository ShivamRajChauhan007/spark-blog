"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current scroll progress 0..1 across the entire document.
 * Refreshes on rAF only — never on scroll (Lenis already throttles).
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const tick = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return progress;
}

/**
 * Maps a global scroll progress (0..1) to which scene is currently active
 * and the local progress within that scene (0..1).
 */
export function activeScene(progress: number, sceneCount: number) {
  const span = 1 / sceneCount;
  const idx = Math.min(sceneCount - 1, Math.floor(progress / span));
  const local = (progress - idx * span) / span;
  return { index: idx, local };
}
