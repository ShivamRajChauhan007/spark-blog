"use client";

import { Canvas } from "@react-three/fiber";
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
import { useScrollProgress, activeScene } from "@/lib/useScrollProgress";
import { SCENES } from "@/lib/scenes";

const SCENE_RENDERERS = [
  { Component: ClusterIdle, range: [0, 1] },
  { Component: WorkerCutaway, range: [0, 2] },
  { Component: DriverIgnite, range: [1, 3] },
  { Component: DataArrival, range: [2, 4] },
  { Component: PartitionShatter, range: [3, 5] },
  { Component: TaskRain, range: [4, 6] },
  { Component: NarrowVsWide, range: [5, 7] },
  { Component: ShuffleScene, range: [6, 8] },
  { Component: StagesDiagram, range: [7, 9] },
  { Component: AirflowDag, range: [8, 10] },
  { Component: EphemeralCycle, range: [9, 11] },
  { Component: FreeCamera, range: [10, 11] }
];

export function SceneStage() {
  const progress = useScrollProgress();
  const { index, local } = activeScene(progress, SCENES.length);

  const isFly = index === 11;

  return (
    <div className="scene-canvas pointer-events-none -z-10" aria-hidden>
      <Canvas
        camera={{ position: [0, 1.8, 7.5], fov: 38, near: 0.1, far: 200 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        className={`!fixed !inset-0 ${isFly ? "!pointer-events-auto" : ""}`}
      >
        <color attach="background" args={["#08090e"]} />
        <fog attach="fog" args={["#08090e", 14, 32]} />

        <ambientLight intensity={0.28} />
        <directionalLight position={[6, 8, 6]} intensity={1.0} castShadow />
        <directionalLight position={[-6, -2, -6]} intensity={0.25} color="#88a" />

        {!isFly && <CameraRig progress={progress} />}

        {SCENE_RENDERERS.map(({ Component, range: [lo, hi] }, i) => {
          const visible = index >= lo && index <= hi;
          const localForThis = index === i ? local : index < i ? 0 : 1;
          if (Component === FreeCamera) {
            return <FreeCamera key={i} visible={visible} />;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Any = Component as any;
          return <Any key={i} progress={localForThis} visible={visible} />;
        })}
      </Canvas>
    </div>
  );
}
