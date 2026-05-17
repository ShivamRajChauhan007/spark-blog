"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ComponentType, useEffect, useRef, useState } from "react";
import type { SceneMeta, SceneId } from "@/lib/scenes";

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

type SceneComp = ComponentType<{ progress: number; visible: boolean }>;

// All scene components share the same prop shape EXCEPT FreeCamera which
// doesn't take `progress` — we wrap it to fit the shape.
const FreeCameraAdapter: SceneComp = ({ visible }) => <FreeCamera visible={visible} />;

const SCENE_COMPONENTS: Record<SceneId, SceneComp> = {
  hero: ClusterIdle,
  anatomy: WorkerCutaway,
  driver: DriverIgnite,
  "data-arrival": DataArrival,
  partitions: PartitionShatter,
  "task-rain": TaskRain,
  "narrow-vs-wide": NarrowVsWide,
  shuffle: ShuffleScene,
  stages: StagesDiagram,
  airflow: AirflowDag,
  ephemeral: EphemeralCycle,
  fly: FreeCameraAdapter
};

const CAMERA_BY_SCENE: Record<SceneId, { pos: [number, number, number]; target: [number, number, number] }> = {
  hero: { pos: [0, 1.5, 7], target: [0, 0, 0] },
  anatomy: { pos: [4.5, 1.2, 3.5], target: [3.2, 0, 0] },
  driver: { pos: [0, 1.0, 3.8], target: [0, 0, 0] },
  "data-arrival": { pos: [-1, 2.6, 7.0], target: [-2, 0, 0] },
  partitions: { pos: [0, 5.5, 5], target: [0, 0, 0] },
  "task-rain": { pos: [4, 2.4, 5.5], target: [0, 0.4, 0] },
  "narrow-vs-wide": { pos: [-4.5, 1.5, 5.5], target: [0, 0, 0] },
  shuffle: { pos: [5.5, 3.8, 5.5], target: [0, 0.5, 0] },
  stages: { pos: [0, 2.4, 6.5], target: [0, 1.0, 0] },
  airflow: { pos: [0, 4.5, 10], target: [0, 2.0, 0] },
  ephemeral: { pos: [3.5, 2.4, 6.5], target: [0, 0, 0] },
  fly: { pos: [0, 2.5, 9], target: [0, 0, 0] }
};

interface Props {
  scene: SceneMeta;
}

/**
 * Per-section 3D canvas. Mounts Canvas only when section is in (or near)
 * viewport — so 12 canvases don't all hold WebGL contexts at once.
 */
export function SceneCanvas({ scene }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setMounted(true);
            setActive(e.intersectionRatio > 0.25);
          } else if (e.intersectionRatio < 0.05) {
            setActive(false);
          }
        }
      },
      { threshold: [0, 0.05, 0.25, 0.5, 1], rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const SceneComponent = SCENE_COMPONENTS[scene.id];
  const cam = CAMERA_BY_SCENE[scene.id];

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-square w-full overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg-elev)]/40 shadow-2xl backdrop-blur md:aspect-[4/5]"
    >
      {mounted ? (
        <Canvas
          camera={{ position: cam.pos, fov: 38, near: 0.1, far: 200 }}
          dpr={[1, 1.8]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          frameloop={active ? "always" : "demand"}
        >
          <color attach="background" args={["#0b0c11"]} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[5, 7, 5]} intensity={1.1} />
          <directionalLight position={[-5, -2, -4]} intensity={0.3} color="#88a" />
          <OrbitControls
            target={cam.target}
            enableDamping
            dampingFactor={0.08}
            minDistance={2}
            maxDistance={20}
            enablePan
          />
          <SceneComponent progress={active ? 0.5 : 0} visible />
        </Canvas>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-[var(--color-fg-muted)]">
          <span className="font-mono text-[10px] uppercase tracking-widest">loading scene…</span>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]/70">
        drag · scroll · right-click
      </div>
    </div>
  );
}
