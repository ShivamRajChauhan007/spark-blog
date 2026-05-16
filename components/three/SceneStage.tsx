"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { ClusterIdle } from "./scenes/ClusterIdle";
import { WorkerCutaway } from "./scenes/WorkerCutaway";
import { DriverIgnite } from "./scenes/DriverIgnite";
import { DataArrival } from "./scenes/DataArrival";
import { CameraRig } from "@/components/scroll/CameraRig";
import { useScrollProgress, activeScene } from "@/lib/useScrollProgress";
import { SCENES } from "@/lib/scenes";

/**
 * The sticky 3D canvas that lives behind the article.
 * Phase 2 wires scenes 1-4. Phases 3-4 add the rest.
 *
 * Each scene gets its own `visible` flag — Three keeps geometry resident
 * but skips rendering invisible groups, so switches are instant.
 */
export function SceneStage() {
  const progress = useScrollProgress();
  const ctxRef = useRef<HTMLDivElement>(null);

  // small effect so the article re-paints when progress crosses scene boundaries
  // — useful for the explainer sidebar key change
  useEffect(() => {
    // noop — useScrollProgress already drives re-render
  }, []);

  const { index, local } = activeScene(progress, SCENES.length);

  return (
    <div className="scene-canvas pointer-events-none -z-10" ref={ctxRef} aria-hidden>
      <Canvas
        camera={{ position: [0, 1.8, 7.5], fov: 38, near: 0.1, far: 200 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className="!fixed !inset-0"
      >
        <color attach="background" args={["#08090e"]} />
        <fog attach="fog" args={["#08090e", 12, 28]} />

        <ambientLight intensity={0.25} />
        <directionalLight position={[6, 8, 6]} intensity={1.0} castShadow />
        <directionalLight position={[-6, -2, -6]} intensity={0.25} color="#88a" />

        <CameraRig progress={progress} />

        {/* Scenes — only the active one (and its neighbour during crossfade) are rendered */}
        <ClusterIdle progress={index === 0 ? local : 1} visible={index <= 1} />
        <WorkerCutaway progress={index === 1 ? local : index < 1 ? 0 : 1} visible={index >= 0 && index <= 2} />
        <DriverIgnite progress={index === 2 ? local : index < 2 ? 0 : 1} visible={index >= 1 && index <= 3} />
        <DataArrival progress={index === 3 ? local : index < 3 ? 0 : 1} visible={index >= 2 && index <= 4} />
        {/* phases 3+ will add more scenes here */}
      </Canvas>
    </div>
  );
}
