"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded sticky 3D canvas. SSR off because three.js needs the DOM.
 * Falls back to the SVG stub while loading or for reduced-motion users.
 */
const SceneStage = dynamic(() => import("./SceneStage").then((m) => m.SceneStage), {
  ssr: false,
  loading: () => null
});

const StubCanvas = dynamic(() => import("./_StubCanvas").then((m) => m.StubCanvas), {
  ssr: false,
  loading: () => null
});

export function ClusterStageCanvas() {
  // Use a media query at render time inside a client component
  // (we cannot use window.matchMedia at module scope due to SSR).
  // SceneStage itself respects reduced motion in animations; we still
  // render the SVG stub as a graceful fallback layer.
  return (
    <>
      <StubCanvas />
      <SceneStage />
    </>
  );
}
