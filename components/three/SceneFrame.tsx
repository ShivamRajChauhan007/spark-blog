"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, useState, type ComponentType } from "react";
import { readActiveSectionLocal } from "@/lib/useActiveSection";

type SceneComponent = ComponentType<{ progress: number; visible: boolean }>;

interface Props {
  index: number;
  renderers: SceneComponent[];
}

/**
 * Renders the active-index scene. Reads section-local progress inside useFrame
 * and pushes it to the active scene via a stable ref + minimal state update
 * (only when the integer index changes), so SceneStage doesn't re-render per
 * frame — which was crashing R3F's WebGL context in dev.
 */
export function SceneFrame({ index, renderers }: Props) {
  const localRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const lastSet = useRef(0);

  useFrame(() => {
    const p = readActiveSectionLocal();
    localRef.current = p;
    // Only push to React state every 8 frames or on big jumps to avoid the
    // per-frame remount issue while still keeping scenes responsive.
    const now = performance.now();
    if (now - lastSet.current > 40 || Math.abs(p - progress) > 0.05) {
      lastSet.current = now;
      setProgress(p);
    }
  });

  return (
    <>
      {renderers.map((R, i) => {
        const visible = i === index;
        return <R key={i} progress={visible ? progress : 0} visible={visible} />;
      })}
    </>
  );
}
