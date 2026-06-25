"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel, InfoCard } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

interface ExecutorState {
  ref: React.RefObject<THREE.Group | null>;
  matRef: React.RefObject<THREE.MeshStandardMaterial | null>;
  cores: number; // simulated parallel tasks
  phase: number;
  speed: number;
  radius: number;
  yOffset: number;
}

/**
 * Scene 2 — translucent worker shell with three executor JVMs inside.
 * Each executor shows a small ring of "core threads" running in parallel.
 * A YARN container ring wraps the whole worker, indicating that YARN is the
 * resource manager carving the VM into containers.
 *
 * Activity loop: every ~2.5s an executor flashes brighter (= task complete)
 * and a small "done" mote drifts out of the worker shell.
 */
export function WorkerCutaway({ progress, visible }: Props) {
  const outer = useRef<THREE.MeshStandardMaterial>(null);
  const orbits = useRef<THREE.Group>(null);
  const yarnRing = useRef<THREE.Mesh>(null);
  const doneMotes = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 2 executors per worker — matches prose "2 executors × 4 cores"
  const executors = useMemo<ExecutorState[]>(
    () => [
      {
        ref: { current: null } as React.RefObject<THREE.Group | null>,
        matRef: { current: null } as React.RefObject<THREE.MeshStandardMaterial | null>,
        cores: 4,
        phase: 0,
        speed: 0.4,
        radius: 0.42,
        yOffset: 0.18
      },
      {
        ref: { current: null } as React.RefObject<THREE.Group | null>,
        matRef: { current: null } as React.RefObject<THREE.MeshStandardMaterial | null>,
        cores: 4,
        phase: Math.PI,
        speed: 0.4,
        radius: 0.42,
        yOffset: -0.18
      }
    ],
    []
  );

  // Track when each executor last "completed a task" — drives the flash + mote
  const lastFlash = useRef<number[]>([0, 0]);
  const moteStates = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        active: false,
        startT: 0,
        execIdx: i % 2,
        seed: i
      })),
    []
  );

  useFrame((_state, dt) => {
    if (!visible) return;
    const now = performance.now() * 0.001;

    if (outer.current) {
      outer.current.opacity = 0.32 + (1 - progress) * 0.4;
      outer.current.transparent = true;
    }
    if (orbits.current) orbits.current.rotation.y += dt * 0.18;
    if (yarnRing.current) yarnRing.current.rotation.z += dt * 0.08;

    // Position executors on their orbit + breathing scale
    executors.forEach((ex, idx) => {
      const g = ex.ref.current;
      if (g) {
        g.position.set(
          Math.cos(now * ex.speed + ex.phase) * ex.radius,
          ex.yOffset,
          Math.sin(now * ex.speed + ex.phase) * ex.radius
        );
      }
      // Periodic "task complete" flash — every ~2.2s offset per executor
      const since = now - lastFlash.current[idx];
      const interval = 2.2 + idx * 0.4;
      if (since > interval) {
        lastFlash.current[idx] = now;
        // launch a done-mote from this executor
        const slot = moteStates.findIndex((m) => !m.active);
        if (slot >= 0) {
          moteStates[slot].active = true;
          moteStates[slot].startT = now;
          moteStates[slot].execIdx = idx;
        }
      }
      const flash = Math.max(0, 1 - since / 0.5); // 500ms flash decay
      if (ex.matRef.current) {
        ex.matRef.current.emissiveIntensity = 0.7 + flash * 1.6;
      }
    });

    // Animate done motes — they spiral up & out of the worker
    if (doneMotes.current) {
      for (let i = 0; i < moteStates.length; i++) {
        const m = moteStates[i];
        if (!m.active) {
          dummy.position.set(999, 999, 999);
          dummy.scale.setScalar(0);
        } else {
          const t = (now - m.startT) / 1.2;
          if (t >= 1) {
            m.active = false;
            dummy.position.set(999, 999, 999);
            dummy.scale.setScalar(0);
          } else {
            const ex = executors[m.execIdx];
            const start = new THREE.Vector3(
              Math.cos(m.startT * ex.speed + ex.phase) * ex.radius,
              ex.yOffset,
              Math.sin(m.startT * ex.speed + ex.phase) * ex.radius
            );
            const dir = new THREE.Vector3(
              Math.cos(m.seed * 1.7) * 1.4,
              0.7 + (m.seed % 3) * 0.2,
              Math.sin(m.seed * 1.7) * 1.4
            );
            dummy.position.lerpVectors(start, dir, t);
            const s = 0.06 * (1 - t);
            dummy.scale.setScalar(s);
          }
        }
        dummy.updateMatrix();
        doneMotes.current.setMatrixAt(i, dummy.matrix);
      }
      doneMotes.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group visible={visible} position={[3.2, 0, 0]}>
      {/* YARN — resource manager ring around the whole VM */}
      <mesh ref={yarnRing} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.32, 1.38, 96]} />
        <meshBasicMaterial color={PALETTE.success} transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* "YARN" label sits beside the green ring, not above the worker, so it
          can't collide with the WORKER InfoCard. */}
      <PlanetLabel
        position={[1.55, 0, 0]}
        text="YARN"
        offset={0}
        size={0.15}
        color="#9be8b3"
      />

      <InfoCard
        position={[0, 0, 0]}
        offset={[0, 1.95, 0]}
        primary="WORKER · n2-highmem-8"
        secondary="8 vCPU · 64 GB RAM"
        color="#c8dfff"
      />
      <InfoCard
        position={[0, 0, 0]}
        offset={[0, -1.75, 0]}
        primary="2 EXECUTORS · JVM"
        secondary="4 cores · 11 GB heap each"
        color="#f4cf9c"
      />

      {/* outer worker shell — the VM */}
      <mesh>
        <sphereGeometry args={[0.95, 36, 36]} />
        <meshStandardMaterial
          ref={outer}
          color={WORKER_TINTS[0]}
          emissive={WORKER_TINTS[0]}
          emissiveIntensity={0.42}
          metalness={0.2}
          roughness={0.5}
          transparent
          opacity={0.42}
          toneMapped={false}
        />
      </mesh>

      {/* inner executors with thread orbits */}
      <group ref={orbits}>
        {executors.map((ex, idx) => (
          <group key={idx} ref={ex.ref}>
            {/* executor JVM */}
            <mesh>
              <sphereGeometry args={[0.18, 22, 22]} />
              <meshStandardMaterial
                ref={ex.matRef}
                color={PALETTE.accent}
                emissive={PALETTE.accent}
                emissiveIntensity={0.7}
                toneMapped={false}
              />
            </mesh>
            {/* core threads orbiting this executor */}
            <CoreThreads count={ex.cores} radius={0.3} phaseOffset={ex.phase} speed={1.0} />
          </group>
        ))}
      </group>

      {/* "task done" motes flying out */}
      <instancedMesh ref={doneMotes} args={[undefined, undefined, 12]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.9} toneMapped={false} />
      </instancedMesh>

      {/* atmosphere */}
      <mesh>
        <sphereGeometry args={[1.16, 36, 36]} />
        <meshBasicMaterial color={WORKER_TINTS[0]} transparent opacity={0.1} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Small ring of "thread" particles orbiting an executor — represents cores. */
function CoreThreads({
  count,
  radius,
  phaseOffset,
  speed
}: {
  count: number;
  radius: number;
  phaseOffset: number;
  speed: number;
}) {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  useFrame(() => {
    const now = performance.now() * 0.001;
    for (let i = 0; i < count; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const a = (i / count) * Math.PI * 2 + now * speed + phaseOffset;
      m.position.set(Math.cos(a) * radius, Math.sin(a * 0.7) * radius * 0.3, Math.sin(a) * radius);
    }
  });
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshBasicMaterial color={PALETTE.fg} transparent opacity={0.95} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}
