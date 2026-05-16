// OKLCH palette tokens — single source of truth.
// Per-scene tint shifts use the warm/cool axis.

import * as THREE from "three";

const oklch = (s: string) => new THREE.Color(s);

export const PALETTE = {
  bg: oklch("oklch(0.14 0.013 252)"),
  bgElev: oklch("oklch(0.17 0.014 252)"),
  fg: oklch("oklch(0.96 0.005 252)"),
  fgMuted: oklch("oklch(0.72 0.012 252)"),
  line: oklch("oklch(0.28 0.012 252)"),
  accent: oklch("oklch(0.78 0.16 65)"), // amber
  accent2: oklch("oklch(0.74 0.14 220)"), // azure
  success: oklch("oklch(0.78 0.16 145)"),
  danger: oklch("oklch(0.68 0.20 25)")
};

// Worker tints — slightly varied to make individual workers identifiable
export const WORKER_TINTS = [
  oklch("oklch(0.78 0.10 200)"),
  oklch("oklch(0.76 0.11 220)"),
  oklch("oklch(0.74 0.12 240)"),
  oklch("oklch(0.72 0.13 260)")
];
