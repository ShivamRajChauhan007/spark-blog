"use client";

import { useSyncExternalStore } from "react";

/**
 * Module-level scroll-progress source. ONE rAF loop, ANY number of consumers.
 * Replaces the previous per-hook rAF that fanned out to four setState loops.
 */

let progress = 0;
const listeners = new Set<() => void>();
let raf = 0;
let started = false;

function tick() {
  const doc = typeof document !== "undefined" ? document.documentElement : null;
  if (doc && typeof window !== "undefined") {
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (p !== progress) {
      progress = p;
      listeners.forEach((l) => l());
    }
  }
  raf = requestAnimationFrame(tick);
}

function start() {
  if (started) return;
  started = true;
  if (typeof window !== "undefined") raf = requestAnimationFrame(tick);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
      started = false;
    }
  };
}

const getSnapshot = () => progress;
const getServerSnapshot = () => 0;

export function useScrollProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Imperative reader for use inside `useFrame` — does NOT subscribe / re-render.
 * The CameraRig reads progress every frame anyway via useFrame, so it bypasses
 * the React reactive path entirely.
 */
export function readScrollProgress() {
  return progress;
}

/** Map global progress 0..1 → active scene and local 0..1 within that scene. */
export function activeScene(p: number, sceneCount: number) {
  const span = 1 / sceneCount;
  const idx = Math.min(sceneCount - 1, Math.max(0, Math.floor(p / span)));
  const local = Math.min(1, Math.max(0, (p - idx * span) / span));
  return { index: idx, local };
}
