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
  worker: number;
}

/** Scene 6 — task spheres rain from the master to the worker planets. */
export function TaskRain({ progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const tasks = useMemo<TaskState[]>(() => {
    const arr: TaskState[] = [];
    for (let i = 0; i < TASKS; i++) {
      arr.push({
        startT: (i / TASKS) * 1.0,
        duration: 0.22 + ((i * 13) % 7) * 0.02,
        worker: i % 4
      });
    }
    return arr;
  }, []);

  const workerPos = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
    });
  }, []);

  useFrame(() => {
    if (!visible || !meshRef.current) return;
    // loop the rain animation locally so it always plays
    const loop = (performance.now() * 0.0003) % 1;
    for (let i = 0; i < TASKS; i++) {
      const t = tasks[i];
      const local = Math.max(0, Math.min(1, (loop - t.startT) / t.duration));
      const e = local * local * (3 - 2 * local);
      const dest = workerPos[t.worker];

      const x = 0 + (dest.x - 0) * e;
      const z = 0 + (dest.z - 0) * e;
      const y = 1.7 * Math.sin(e * Math.PI);

      dummy.position.set(x, y, z);
      const inFlight = local > 0 && local < 1;
      dummy.scale.setScalar(inFlight ? 0.07 + Math.sin(local * Math.PI) * 0.04 : 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      tmpColor.copy(PALETTE.fg).lerp(WORKER_TINTS[t.worker], e);
      meshRef.current.setColorAt(i, tmpColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      {/* master */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* workers */}
      {workerPos.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.45, 24, 24]} />
          <meshStandardMaterial color={WORKER_TINTS[i]} emissive={WORKER_TINTS[i]} emissiveIntensity={0.5} toneMapped={false} />
        </mesh>
      ))}
      <instancedMesh ref={meshRef} args={[undefined, undefined, TASKS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={PALETTE.fg} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
