"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { ComponentType, useEffect, useRef, useState } from "react";
import type { SceneMeta, SceneId } from "@/lib/scenes";
import { useReducedMotion } from "@/lib/useReducedMotion";

import { ClusterIdle } from "./scenes/ClusterIdle";
import { WorkerCutaway } from "./scenes/WorkerCutaway";
import { DriverIgnite } from "./scenes/DriverIgnite";
import { DataArrival } from "./scenes/DataArrival";
import { ActionTriggerScene } from "./scenes/ActionTriggerScene";
import { PartitionShatter } from "./scenes/PartitionShatter";
import { TaskRain } from "./scenes/TaskRain";
import { NarrowVsWide } from "./scenes/NarrowVsWide";
import { JoinsScene } from "./scenes/JoinsScene";
import { ShuffleScene } from "./scenes/ShuffleScene";
import { AqeScene } from "./scenes/AqeScene";
import { StagesDiagram } from "./scenes/StagesDiagram";
import { MachineTypesScene } from "./scenes/MachineTypesScene";
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
  "action-trigger": ActionTriggerScene,
  partitions: PartitionShatter,
  "task-rain": TaskRain,
  "narrow-vs-wide": NarrowVsWide,
  joins: JoinsScene,
  shuffle: ShuffleScene,
  aqe: AqeScene,
  stages: StagesDiagram,
  "machine-types": MachineTypesScene,
  airflow: AirflowDag,
  ephemeral: EphemeralCycle,
  fly: FreeCameraAdapter
};

const CAMERA_BY_SCENE: Record<SceneId, { pos: [number, number, number]; target: [number, number, number] }> = {
  hero: { pos: [0, 1.5, 7.8], target: [0, 0, 0] },
  anatomy: { pos: [5.8, 1.4, 5.4], target: [3.2, 0, 0] },
  driver: { pos: [0, 1.6, 7.2], target: [0, 0, 0] },
  "data-arrival": { pos: [-1, 2.6, 7.0], target: [-2, 0, 0] },
  "action-trigger": { pos: [0, 2.0, 8], target: [0, 0, 0] },
  partitions: { pos: [0, 5.5, 5], target: [0, 0, 0] },
  "task-rain": { pos: [4, 2.4, 5.5], target: [0, 0.4, 0] },
  "narrow-vs-wide": { pos: [0, 1.0, 7.5], target: [0, 0, 0] },
  joins: { pos: [0, 3.5, 8], target: [0, 0, 0] },
  shuffle: { pos: [5.5, 3.8, 5.5], target: [0, 0.5, 0] },
  aqe: { pos: [0, 3.2, 7.5], target: [0, 0.2, 0] },
  stages: { pos: [0, 1.2, 8.5], target: [0, 0, 0] },
  "machine-types": { pos: [0, 2.0, 8.5], target: [0, 0, 0] },
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
  const reduced = useReducedMotion();
  const [smallScreen, setSmallScreen] = useState(false);

  // On phones (and for prefers-reduced-motion users) we serve a static SVG
  // poster instead of a live WebGL canvas: 12 GL contexts on a mobile GPU is
  // both heavy and prone to context loss. 768px matches the `md:` breakpoint
  // the article layout already switches on.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    setSmallScreen(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setSmallScreen(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const useStatic = reduced || smallScreen;

  useEffect(() => {
    if (useStatic || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setMounted(true);
            setActive(e.intersectionRatio > 0.25);
          } else {
            // Scrolled well away (beyond the 200px rootMargin): tear the canvas
            // down so its WebGL context is released. Browsers cap live contexts
            // (~8–16, fewer on mobile Safari) and these 12 scenes would otherwise
            // accumulate and start dropping contexts on a long scroll.
            setActive(false);
            setMounted(false);
          }
        }
      },
      { threshold: [0, 0.05, 0.25, 0.5, 1], rootMargin: "200px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useStatic]);

  const SceneComponent = SCENE_COMPONENTS[scene.id];
  const cam = CAMERA_BY_SCENE[scene.id];

  return (
    <div
      ref={wrapperRef}
      className="relative aspect-square w-full overflow-hidden md:aspect-[4/5]"
    >
      {useStatic ? (
        <ScenePoster />
      ) : mounted ? (
        <Canvas
          camera={{ position: cam.pos, fov: 50, near: 0.1, far: 200 }}
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
      {scene.caption && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[20rem]">
          <p className="font-serif text-[12.5px] leading-snug text-[var(--color-fg)]/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.95)]">
            {scene.caption}
          </p>
        </div>
      )}
      {!useStatic && (
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]/70">
          drag · scroll · right-click
        </div>
      )}
      {scene.legend && scene.legend.length > 0 && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-end">
          <div className="pointer-events-auto max-w-[90%] rounded-xl border border-[var(--color-line)]/70 bg-[var(--color-bg)]/85 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]/80">
              Legend
            </p>
            <ul className="space-y-1.5 text-[12px] leading-[1.35] text-[var(--color-fg)]/90">
              {scene.legend.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-[5px] inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-[var(--color-bg)]/60"
                    style={{ backgroundColor: item.swatch ?? "var(--color-accent)" }}
                  />
                  <span className="font-serif">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Static, dependency-free SVG stand-in for the live WebGL scene. Shown to
 * reduced-motion users and on small screens. Fills the aspect-ratio wrapper
 * (unlike `_StubCanvas`, which is `position: fixed` for the legacy full-bleed
 * layout). It evokes the cluster topology — a driver core wired to four
 * worker nodes over a field of data motes — so the poster reads as "the same
 * thing, paused" rather than a blank box.
 */
function ScenePoster() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <radialGradient id="poster-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1c1e26" />
            <stop offset="100%" stopColor="#0b0c11" />
          </radialGradient>
        </defs>
        <rect width="1000" height="1000" fill="url(#poster-bg)" />
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i * 137) % 1000;
          const y = (i * 211) % 1000;
          const r = (i % 3) + 0.6;
          return <circle key={i} cx={x} cy={y} r={r} fill="#eaeaf0" opacity={0.3} />;
        })}
        <g transform="translate(500,500)">
          {(
            [
              [-220, -160],
              [220, -160],
              [-220, 160],
              [220, 160]
            ] as const
          ).map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <line x1="0" y1="0" x2={-x} y2={-y} stroke="#3c3d44" strokeWidth="0.8" strokeDasharray="3 5" />
              <rect x="-30" y="-30" width="60" height="60" rx="6" fill="none" stroke="#5fa8e5" strokeWidth="1.2" />
            </g>
          ))}
          <rect x="-40" y="-40" width="80" height="80" rx="6" fill="none" stroke="#e89856" strokeWidth="1.6" />
        </g>
      </svg>
    </div>
  );
}
