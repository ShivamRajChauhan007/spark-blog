"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** SVG fallback used as the loading slot AND as the reduced-motion replacement. */
const StubCanvas = dynamic(() => import("./_StubCanvas").then((m) => m.StubCanvas), {
  ssr: false,
  loading: () => null
});

/** The real 3D canvas, lazy-loaded with the SVG as its loading state. */
const SceneStage = dynamic(() => import("./SceneStage").then((m) => m.SceneStage), {
  ssr: false,
  loading: () => <StubCanvas />
});

export function ClusterStageCanvas() {
  const reduced = useReducedMotion();
  if (reduced) return <StubCanvas />;
  return <SceneStage />;
}
