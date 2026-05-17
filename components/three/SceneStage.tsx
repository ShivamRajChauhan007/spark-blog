"use client";

import { Canvas } from "@react-three/fiber";
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

// Stable WebGL config — module scope so Canvas isn't recreated per render.
const GL_CONFIG = { antialias: true, powerPreference: "high-performance" as const };
const CAMERA_CONFIG = { position: [0, 1.8, 7.5] as [number, number, number], fov: 38, near: 0.1, far: 200 };
const DPR_CONFIG: [number, number] = [1, 1.8];

export function SceneStage() {
  const index = useActiveSection();
  const isFly = index === 11;

  return (
    <div className={`scene-canvas ${isFly ? "!pointer-events-auto" : ""}`} aria-hidden>
      <Canvas camera={CAMERA_CONFIG} dpr={DPR_CONFIG} gl={GL_CONFIG}>
        <color attach="background" args={["#08090e"]} />
        <fog attach="fog" args={["#08090e", 14, 32]} />

        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 6]} intensity={1.2} castShadow />
        <directionalLight position={[-6, -2, -6]} intensity={0.35} color="#88a" />

        <Starfield />

        {!isFly && <CameraRig />}
        <SceneFrame index={index} renderers={SCENE_RENDERERS} />
        <FreeCamera visible={isFly} />

        {/* No EffectComposer — the postprocessing lib crashes Turbopack dev on
            WebGL context-loss during HMR. Scenes compensate with higher
            emissiveIntensity on key materials. Production worked fine with
            bloom but we keep parity dev⇄prod by leaving it out. */}
      </Canvas>
    </div>
  );
}
