"use client";

import { Canvas, type RootState } from "@react-three/fiber";
import { useState, useCallback } from "react";
import { Starfield } from "./Starfield";
import { ClusterIdle } from "./scenes/ClusterIdle";
import { WorkerCutaway } from "./scenes/WorkerCutaway";
import { DriverIgnite } from "./scenes/DriverIgnite";
import { DataArrival } from "./scenes/DataArrival";
import { PartitionShatter } from "./scenes/PartitionShatter";
import { TaskRain } from "./scenes/TaskRain";
import { NarrowVsWide } from "./scenes/NarrowVsWide";
import { ShuffleScene } from "./scenes/ShuffleScene";
import { StagesDiagram } from "./scenes/StagesDiagram";
import { AirflowDag } from "./scenes/AirflowDag";
import { EphemeralCycle } from "./scenes/EphemeralCycle";
import { FreeCamera } from "./scenes/FreeCamera";
import { CameraRig } from "@/components/scroll/CameraRig";
import { useActiveSection } from "@/lib/useActiveSection";
import { SceneFrame } from "./SceneFrame";

const SCENE_RENDERERS = [
  ClusterIdle,
  WorkerCutaway,
  DriverIgnite,
  DataArrival,
  PartitionShatter,
  TaskRain,
  NarrowVsWide,
  ShuffleScene,
  StagesDiagram,
  AirflowDag,
  EphemeralCycle
];

// Module-scope Canvas config (must be stable refs).
const GL_CONFIG = {
  antialias: true,
  powerPreference: "high-performance" as const,
  preserveDrawingBuffer: false,
  failIfMajorPerformanceCaveat: false
};
const CAMERA_CONFIG = { position: [0, 1.8, 7.5] as [number, number, number], fov: 38, near: 0.1, far: 200 };
const DPR_CONFIG: [number, number] = [1, 1.8];

export function SceneStage() {
  const index = useActiveSection();
  const isFly = index === 11;
  // Force re-mount on context loss so the whole r3f tree rebuilds cleanly.
  const [resetKey, setResetKey] = useState(0);

  const onCreated = useCallback((state: RootState) => {
    const canvas = state.gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      // give the browser a moment to clean up, then force a clean remount
      setTimeout(() => setResetKey((k) => k + 1), 200);
    };
    canvas.addEventListener("webglcontextlost", lost as EventListener, { passive: false });
    canvas.addEventListener("webglcontextrestored", () => setResetKey((k) => k + 1));
  }, []);

  return (
    <div className={`scene-canvas ${isFly ? "!pointer-events-auto" : ""}`} aria-hidden>
      <Canvas
        key={resetKey}
        camera={CAMERA_CONFIG}
        dpr={DPR_CONFIG}
        gl={GL_CONFIG}
        onCreated={onCreated}
      >
        <color attach="background" args={["#08090e"]} />
        <fog attach="fog" args={["#08090e", 14, 32]} />

        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 6]} intensity={1.2} castShadow />
        <directionalLight position={[-6, -2, -6]} intensity={0.35} color="#88a" />

        <Starfield />

        {!isFly && <CameraRig />}
        <SceneFrame index={index} renderers={SCENE_RENDERERS} />
        <FreeCamera visible={isFly} />
      </Canvas>
    </div>
  );
}
