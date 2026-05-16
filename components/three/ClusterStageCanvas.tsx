"use client";

import dynamic from "next/dynamic";

/**
 * Single sticky 3D canvas that lives behind every scene.
 * The active scene is chosen by scroll position; one camera rig interpolates.
 *
 * In Phase 1 this is a stub — pure SVG fallback.
 * Phase 2 will swap in a real Three.js scene via dynamic import.
 */
export const ClusterStageCanvas = dynamic(() => import("./_StubCanvas").then((m) => m.StubCanvas), {
  ssr: false,
  loading: () => <div className="scene-canvas" aria-hidden />
});
