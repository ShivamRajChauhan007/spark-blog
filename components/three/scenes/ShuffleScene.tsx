"use client";

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

interface Row {
  startExec: number;
  destExec: number;
  curveSeed: number;
}

/** Scene 8 — THE CENTERPIECE — the shuffle.
 * Rows physically arc between executors on Catmull-Rom curves.
 * Rendered as instanced spheres tracing positions along curves over `progress`.
 */
export function ShuffleScene({ progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  // executor positions in a 4-point arrangement (corners of a square)
  const execPos = useMemo(() => {
    return Array.from({ length: EXECUTORS }, (_, i) => {
      const a = (i / EXECUTORS) * Math.PI * 2 + Math.PI / 4;
      return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
    });
  }, []);

  // deterministic row assignment: most rows go to a *different* executor than they start at
  const rows = useMemo<Row[]>(() => {
    const arr: Row[] = [];
    for (let i = 0; i < ROWS; i++) {
      const start = i % EXECUTORS;
      // hash-like: target = (i * 17 + 3) % EXECUTORS, ensuring spread
      const dest = (i * 17 + 3) % EXECUTORS;
      arr.push({ startExec: start, destExec: dest, curveSeed: i });
    }
    return arr;
  }, []);

  // pre-build curves per row
  const curves = useMemo<THREE.CatmullRomCurve3[]>(() => {
    return rows.map((r) => {
      const a = execPos[r.startExec].clone();
      const b = execPos[r.destExec].clone();
      // control point lifted upward, jittered by seed
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
    // staggered: each row has its own start window, but most overlap to look like a flock
    for (let i = 0; i < ROWS; i++) {
      const r = rows[i];
      const stagger = (i / ROWS) * 0.5; // row i starts after `stagger`
      const local = Math.max(0, Math.min(1, (progress - stagger) / 0.5));
      const e = local * local * (3 - 2 * local);
      const p = curves[i].getPointAt(e);
      dummy.position.copy(p);
      const inFlight = local > 0 && local < 1;
      dummy.scale.setScalar(inFlight ? 0.05 : 0);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // blend colour from start tint -> dest tint
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
        <mesh key={i} position={p}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color={WORKER_TINTS[i]} emissive={WORKER_TINTS[i]} emissiveIntensity={0.35} />
        </mesh>
      ))}
      {/* flying rows */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, ROWS]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={PALETTE.fg} />
      </instancedMesh>
    </group>
  );
}
