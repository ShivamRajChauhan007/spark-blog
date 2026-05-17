"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

const EXECUTORS = 4;
const ROWS = 96;
const EXECUTOR_LABELS = ["A", "B", "C", "D"];

interface Row {
  startExec: number;
  destExec: number;
  curveSeed: number;
}

/** Scene 8 — THE CENTERPIECE — the shuffle.
 * Rows physically arc between executors on Catmull-Rom curves.
 * Executors are labeled A/B/C/D so the reader can read "row from A to C".
 */
export function ShuffleScene({ progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // Executor positions arranged as a square
  const execPos = useMemo(() => {
    return Array.from({ length: EXECUTORS }, (_, i) => {
      const a = (i / EXECUTORS) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
    });
  }, []);

  const rows = useMemo<Row[]>(() => {
    const arr: Row[] = [];
    for (let i = 0; i < ROWS; i++) {
      const start = i % EXECUTORS;
      const dest = (i * 17 + 3) % EXECUTORS;
      arr.push({ startExec: start, destExec: dest, curveSeed: i });
    }
    return arr;
  }, []);

  const curves = useMemo<THREE.CatmullRomCurve3[]>(() => {
    return rows.map((r) => {
      const a = execPos[r.startExec].clone();
      const b = execPos[r.destExec].clone();
      const mid = a.clone().lerp(b, 0.5);
      const lift = 2.0 + ((r.curveSeed * 31) % 17) * 0.05;
      const sway = ((r.curveSeed * 13) % 11) * 0.08 - 0.4;
      mid.y += lift;
      mid.x += sway;
      mid.z -= sway;
      return new THREE.CatmullRomCurve3([a, mid, b]);
    });
  }, [rows, execPos]);

  useFrame(() => {
    if (!visible || !meshRef.current) return;
    for (let i = 0; i < ROWS; i++) {
      const r = rows[i];
      const stagger = (i / ROWS) * 0.5;
      const local = Math.max(0, Math.min(1, (progress - stagger) / 0.5));
      const e = local * local * (3 - 2 * local);
      const p = curves[i].getPointAt(e);
      dummy.position.copy(p);
      const inFlight = local > 0 && local < 1;
      const arc = inFlight ? Math.sin(local * Math.PI) : 0;
      dummy.scale.setScalar(0.12 + arc * 0.18);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      tmpColor.copy(WORKER_TINTS[r.startExec]).lerp(WORKER_TINTS[r.destExec], e);
      meshRef.current.setColorAt(i, tmpColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      {/* executors as labeled cubes */}
      {execPos.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color={WORKER_TINTS[i]} emissive={WORKER_TINTS[i]} emissiveIntensity={0.4} />
          </mesh>
          <Text
            position={[0, 0.85, 0]}
            fontSize={0.45}
            color="#f4f4f5"
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="#08090e"
          >
            {EXECUTOR_LABELS[i]}
          </Text>
        </group>
      ))}
      {/* flying rows */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, ROWS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={PALETTE.fg} transparent opacity={0.95} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
