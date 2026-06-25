"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const TASKS = 80;

/**
 * Scene 6 — labeled master + workers with task spheres raining between them.
 * Workers now FLASH when a task arrives, and a brief inner pulse simulates
 * the executor "processing" before the next task lands.
 */
export function TaskRain({ progress: _progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const tasks = useMemo(() => {
    return Array.from({ length: TASKS }, (_, i) => ({
      startT: (i / TASKS) * 1.0,
      duration: 0.22 + ((i * 13) % 7) * 0.02,
      worker: i % 4
    }));
  }, []);

  const workerPos = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
    });
  }, []);

  // refs for worker materials — used to flash on task arrival
  const workerMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  // last task arrival time per worker (seconds since start)
  const lastArrival = useRef<number[]>([0, 0, 0, 0]);

  useFrame(() => {
    if (!visible || !meshRef.current) return;
    const t0 = performance.now() * 0.001;
    const loop = (performance.now() * 0.0003) % 1;

    for (let i = 0; i < TASKS; i++) {
      const t = tasks[i];
      const local = Math.max(0, Math.min(1, (loop - t.startT) / t.duration));
      const e = local * local * (3 - 2 * local);
      const dest = workerPos[t.worker];
      const x = dest.x * e;
      const z = dest.z * e;
      const y = 1.7 * Math.sin(e * Math.PI);
      dummy.position.set(x, y, z);
      const inFlight = local > 0 && local < 1;
      dummy.scale.setScalar(inFlight ? 0.08 + Math.sin(local * Math.PI) * 0.04 : 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      tmpColor.copy(PALETTE.fg).lerp(WORKER_TINTS[t.worker], e);
      meshRef.current.setColorAt(i, tmpColor);

      // When a task "lands" (just past local=1), mark the worker as recently-hit.
      if (local > 0.97 && local < 1) {
        lastArrival.current[t.worker] = t0;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Apply flash decay to each worker material
    for (let w = 0; w < 4; w++) {
      const m = workerMats.current[w];
      if (!m) continue;
      const since = t0 - lastArrival.current[w];
      const flash = Math.max(0, 1 - since / 0.5);
      m.emissiveIntensity = 0.5 + flash * 1.5;
    }
  });

  return (
    <group visible={visible}>
      {/* master */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.75} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[0, 0, 0]} text="DRIVER" offset={0.82} size={0.14} color="#f4cf9c" />

      {/* workers — refs captured for flash effect */}
      {workerPos.map((p, i) => (
        <group key={i}>
          <mesh position={p}>
            <sphereGeometry args={[0.45, 28, 28]} />
            <meshStandardMaterial
              ref={(el) => {
                workerMats.current[i] = el;
              }}
              color={WORKER_TINTS[i]}
              emissive={WORKER_TINTS[i]}
              emissiveIntensity={0.55}
              toneMapped={false}
            />
          </mesh>
          <mesh position={p}>
            <sphereGeometry args={[0.56, 28, 28]} />
            <meshBasicMaterial color={WORKER_TINTS[i]} transparent opacity={0.13} toneMapped={false} depthWrite={false} />
          </mesh>
          <PlanetLabel position={[p.x, p.y, p.z]} text={`W${i + 1}`} offset={0.72} size={0.16} color="#c8dfff" />
        </group>
      ))}

      <instancedMesh ref={meshRef} args={[undefined, undefined, TASKS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={PALETTE.fg} toneMapped={false} />
      </instancedMesh>

    </group>
  );
}
