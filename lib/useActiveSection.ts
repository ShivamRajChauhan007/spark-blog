"use client";

import { useEffect, useState } from "react";
import { SceneId, SCENES } from "./scenes";

/**
 * Source of truth for "which section is the reader actually looking at?".
 * Measures the y-position of every `<section data-scene-id="...">` and picks the
 * one whose midpoint is closest to viewport-center. This is independent of the
 * scroll-progress float used to drive camera animation — so the ProgressMap,
 * ExplainerSidebar, and SceneCueDriver stay synced with the prose in the
 * viewport even when the header consumes some scrollable height.
 */
let _activeId: SceneId = SCENES[0].id;
let _activeIndex = 0;
const _listeners = new Set<() => void>();
let _io: IntersectionObserver | null = null;
let _started = false;

function _start() {
  if (_started) return;
  if (typeof window === "undefined") return;
  _started = true;
  // Track each section's intersection ratio; the one with highest visibility wins.
  const sections: HTMLElement[] = Array.from(document.querySelectorAll<HTMLElement>("section[data-scene-id]"));
  if (sections.length === 0) {
    // try again next frame — DOM not ready
    _started = false;
    requestAnimationFrame(_start);
    return;
  }
  const ratios = new Map<HTMLElement, number>();
  _io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        ratios.set(e.target as HTMLElement, e.intersectionRatio);
      }
      // pick the most-visible section
      let best: HTMLElement | null = null;
      let bestRatio = 0;
      for (const [el, r] of ratios.entries()) {
        if (r > bestRatio) {
          bestRatio = r;
          best = el;
        }
      }
      if (!best) return;
      const id = best.dataset.sceneId as SceneId;
      const idx = SCENES.findIndex((s) => s.id === id);
      if (idx >= 0 && idx !== _activeIndex) {
        _activeId = id;
        _activeIndex = idx;
        _listeners.forEach((l) => l());
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] }
  );
  sections.forEach((s) => _io!.observe(s));
}

function _subscribe(cb: () => void) {
  _listeners.add(cb);
  _start();
  return () => {
    _listeners.delete(cb);
    if (_listeners.size === 0 && _io) {
      _io.disconnect();
      _io = null;
      _started = false;
    }
  };
}

import { useSyncExternalStore } from "react";

export function useActiveSection() {
  return useSyncExternalStore(
    _subscribe,
    () => _activeIndex,
    () => 0
  );
}

/** Imperative reader for use inside useFrame — no React subscription. */
export function readActiveSection() {
  return _activeIndex;
}

/** Same SSR-safe pattern but exposed for components that want the id. */
export function useActiveSceneId(): SceneId {
  const idx = useActiveSection();
  return SCENES[idx]?.id ?? SCENES[0].id;
}
