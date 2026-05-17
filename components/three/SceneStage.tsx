"use client";

import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
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
import { useScrollProgress, activeScene } from "@/lib/useScrollProgress";
import { useActiveSection } from "@/lib/useActiveSection";
import { SCENES } from "@/lib/scenes";

// Each scene is visible only on its OWN index — no neighbouring overlap.
// (Crossfades happen via individual scene's `progress` ramp, not parallel rendering.)
const SCENE_RENDERERS = [
  { Component: ClusterIdle, index: 0 },
  { Component: WorkerCutaway, index: 1 },
  { Component: DriverIgnite, index: 2 },
  { Component: DataArrival, index: 3 },
  { Component: PartitionShatter, index: 4 },
  { Component: TaskRain, index: 5 },
  { Component: NarrowVsWide, index: 6 },
  { Component: ShuffleScene, index: 7 },
  { Component: StagesDiagram, index: 8 },
  { Component: AirflowDag, index: 9 },
  { Component: EphemeralCycle, index: 10 },
  { Component: FreeCamera, index: 11 }
];

export function SceneStage() {
  const progress = useScrollProgress();
  const sectionIndex = useActiveSection();
  // 3D selection follows the section the reader is *actually* looking at,
  // independent of the float scroll-progress that drives camera interpolation.
  const { local } = activeScene(progress, SCENES.length);
  const index = sectionIndex;

  const isFly = index === 11;
  // Stronger bloom around scenes that lean on emissive (shuffle, driver, airflow)
  const bloomIntensity = (() => {
    if (index === 2) return 0.7;
    if (index === 7) return 1.1; // SHUFFLE
    if (index === 9) return 0.6; // airflow
    return 0.45;
  })();

  return (
    <div className={`scene-canvas ${isFly ? "!pointer-events-auto" : ""}`} aria-hidden>
      <Canvas
        camera={{ position: [0, 1.8, 7.5], fov: 38, near: 0.1, far: 200 }}
        dpr={[1, 1.8]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#08090e"]} />
        <fog attach="fog" args={["#08090e", 14, 32]} />

        <ambientLight intensity={0.28} />
        <directionalLight position={[6, 8, 6]} intensity={1.0} castShadow />
        <directionalLight position={[-6, -2, -6]} intensity={0.25} color="#88a" />

        <Starfield />

        {!isFly && <CameraRig progress={progress} />}

        {SCENE_RENDERERS.map(({ Component, index: sceneIndex }, i) => {
          const visible = index === sceneIndex;
          const localForThis = visible ? local : 0;
          if (Component === FreeCamera) {
            return <FreeCamera key={i} visible={visible} />;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Any = Component as any;
          return <Any key={i} progress={localForThis} visible={visible} />;
        })}

        <EffectComposer multisampling={0}>
          <Bloom intensity={bloomIntensity} luminanceThreshold={0.18} luminanceSmoothing={0.8} mipmapBlur />
          <Vignette eskil={false} offset={0.18} darkness={0.78} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
