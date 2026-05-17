"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/lib/useReducedMotion";

const SceneStage = dynamic(() => import("./SceneStage").then((m) => m.SceneStage), {
  ssr: false,
  loading: () => null
});

const StubCanvas = dynamic(() => import("./_StubCanvas").then((m) => m.StubCanvas), {
  ssr: false,
  loading: () => null
});

export function ClusterStageCanvas() {
  const reduced = useReducedMotion();
  // Reduced-motion users see only the static SVG; everyone else gets both
  // (SVG renders behind the canvas for the loading moment and on canvas errors).
  if (reduced) return <StubCanvas />;
  return (
    <>
      <StubCanvas />
      <SceneStage />
    </>
  );
}
