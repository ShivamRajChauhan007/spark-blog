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

const EXEC_Y = [1.4, 0, -1.4];
const PER = 6;

/**
 * Scene 8 — narrow vs wide. Both sides show three stacked executors.
 * LEFT (narrow): rows stay clustered at their own executor — no lines cross
 * between executors; some rows shrink away (filtered out). RIGHT (wide): rows
 * fly BETWEEN executors along bowed paths — the data movement a shuffle forces.
 * The contrast (no movement vs lots of movement) is the whole point.
 */
export function NarrowVsWide({ progress: _progress, visible }: Props) {
  const leftRef = useRef<THREE.InstancedMesh>(null);
  const rightRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmp = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!visible) return;
    const t = performance.now() * 0.0004;

    // NARROW — rows orbit their own executor in place; filtered rows shrink
    if (leftRef.current) {
      let idx = 0;
      for (let e = 0; e < 3; e++) {
        for (let k = 0; k < PER; k++) {
          const a = (k / PER) * Math.PI * 2 + t;
          dummy.position.set(-2.4 + Math.cos(a) * 0.45, EXEC_Y[e] + Math.sin(a) * 0.22, Math.sin(a * 1.3) * 0.3);
          const kept = (k + e) % 3 !== 0;
          dummy.scale.setScalar(kept ? 0.12 : 0.05);
          dummy.updateMatrix();
          leftRef.current.setMatrixAt(idx, dummy.matrix);
          leftRef.current.setColorAt(idx, kept ? PALETTE.success : PALETTE.line);
          idx++;
        }
      }
      leftRef.current.instanceMatrix.needsUpdate = true;
      if (leftRef.current.instanceColor) leftRef.current.instanceColor.needsUpdate = true;
    }

    // WIDE — rows travel between executors, bowing outward to show the hop
    if (rightRef.current) {
      let idx = 0;
      for (let e = 0; e < 3; e++) {
        for (let k = 0; k < PER; k++) {
          const to = (e + 1 + (k % 2)) % 3;
          const p = (t * 1.4 + k / PER + e * 0.2) % 1;
          const y = EXEC_Y[e] + (EXEC_Y[to] - EXEC_Y[e]) * p;
          dummy.position.set(2.4 + Math.sin(p * Math.PI) * 0.9, y, Math.cos(p * Math.PI) * 0.3);
          dummy.scale.setScalar(0.1);
          dummy.updateMatrix();
          rightRef.current.setMatrixAt(idx, dummy.matrix);
          tmp.copy(WORKER_TINTS[to]);
          rightRef.current.setColorAt(idx, tmp);
          idx++;
        }
      }
      rightRef.current.instanceMatrix.needsUpdate = true;
      if (rightRef.current.instanceColor) rightRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group visible={visible}>
      {EXEC_Y.map((y, e) => (
        <group key={e}>
          <mesh position={[-2.4, y, 0]}>
            <sphereGeometry args={[0.26, 20, 20]} />
            <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
          <mesh position={[2.4, y, 0]}>
            <sphereGeometry args={[0.26, 20, 20]} />
            <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <PlanetLabel position={[-2.4, 1.4, 0]} text="NARROW · filter" offset={1.05} size={0.16} color="#9be8b3" />
      <PlanetLabel position={[2.4, 1.4, 0]} text="WIDE · groupBy" offset={1.05} size={0.16} color="#9fcef7" />

      <instancedMesh ref={leftRef} args={[undefined, undefined, 3 * PER]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={PALETTE.success} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rightRef} args={[undefined, undefined, 3 * PER]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={PALETTE.accent2} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
