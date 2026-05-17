"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

const TASKS = 80;

interface TaskState {
  startT: number;
  duration: number;
  worker: number; // 0..3
}

/** Scene 6 — tasks rain from the driver to the workers. */
export function TaskRain({ progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // generate deterministic schedule
  const tasks = useMemo<TaskState[]>(() => {
    const arr: TaskState[] = [];
    for (let i = 0; i < TASKS; i++) {
      arr.push({
        startT: (i / TASKS) * 0.85, // staggered
        duration: 0.18 + ((i * 13) % 7) * 0.02,
        worker: i % 4
      });
    }
    return arr;
  }, []);

  const workerPos = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(Math.cos(a) * 3, 0, Math.sin(a) * 3);
    });
  }, []);

  useFrame(() => {
    if (!visible || !meshRef.current) return;
    for (let i = 0; i < TASKS; i++) {
      const t = tasks[i];
      const local = Math.max(0, Math.min(1, (progress - t.startT) / t.duration));
      const e = local * local * (3 - 2 * local);
      const dest = workerPos[t.worker];

      // origin at master (0,0,0), arc up then down to worker
      const x = 0 + (dest.x - 0) * e;
      const z = 0 + (dest.z - 0) * e;
      const y = 1.6 * Math.sin(e * Math.PI) + 0.0; // arc

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(local === 0 || local === 1 ? 0 : 0.07);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // colour: derive worker tint and write it
      const c = WORKER_TINTS[t.worker];
      meshRef.current.setColorAt(i, c);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      {/* master */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.4} />
      </mesh>
      {/* workers */}
      {workerPos.map((p, i) => (
        <mesh key={i} position={p}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
          <meshStandardMaterial color={WORKER_TINTS[i]} emissive={WORKER_TINTS[i]} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* tasks */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, TASKS]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={PALETTE.fg} />
      </instancedMesh>
    </group>
  );
}
