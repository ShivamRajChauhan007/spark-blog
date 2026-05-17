"use client";

import { Stars } from "@react-three/drei";

/** Subtle starfield backdrop — adds depth behind every scene. */
export function Starfield() {
  return (
    <Stars
      radius={60}
      depth={50}
      count={1200}
      factor={2.2}
      saturation={0}
      fade
      speed={0.4}
    />
  );
}
