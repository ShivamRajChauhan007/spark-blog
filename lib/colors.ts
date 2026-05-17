// Palette tokens. CSS uses oklch() values from globals.css; Three.js needs
// real hex because THREE.Color does not parse oklch yet (still issues a
// "Unknown color model oklch(...)" warning as of three@0.184).
// Hex values below are sRGB approximations of the corresponding oklch tokens.

import * as THREE from "three";

const c = (hex: string) => new THREE.Color(hex);

export const PALETTE = {
  bg: c("#0c0d12"),       // oklch(0.14 0.013 252)
  bgElev: c("#13141a"),   // oklch(0.17 0.014 252)
  fg: c("#f4f4f5"),       // oklch(0.96 0.005 252)
  fgMuted: c("#b0b0b8"),  // oklch(0.72 0.012 252)
  line: c("#3c3d44"),     // oklch(0.28 0.012 252)
  accent: c("#e89856"),   // oklch(0.78 0.16 65)  — warm amber
  accent2: c("#5fa8e5"),  // oklch(0.74 0.14 220) — cool azure
  success: c("#62cf83"),  // oklch(0.78 0.16 145)
  danger: c("#e96440")    // oklch(0.68 0.20 25)
};

export const WORKER_TINTS = [
  c("#79b9d4"), // cyan
  c("#6cabe0"), // sky blue
  c("#6c9fe6"), // blue
  c("#7c95df")  // purple-blue
];
