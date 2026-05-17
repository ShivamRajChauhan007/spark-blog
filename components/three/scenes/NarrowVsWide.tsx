"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

const ROWS = 32;

/** Scene 7 — split view. Left side stays still (narrow); right side rows hop (wide). */
export function NarrowVsWide({ progress, visible }: Props) {
  const left = useRef<THREE.InstancedMesh>(null);
  const right = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!visible) return;
    const t = progress;
    // left: rows arranged in 4 columns x 8 rows, change colour by simple filter
    if (left.current) {
      for (let i = 0; i < ROWS; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        dummy.position.set(-3 + col * 0.45, 1 - row * 0.32, 0);
        dummy.scale.setScalar(0.16);
        dummy.updateMatrix();
        left.current.setMatrixAt(i, dummy.matrix);
        const keep = (i + Math.floor(t * 4)) % 3 === 0;
        left.current.setColorAt(i, keep ? PALETTE.success : PALETTE.line);
      }
      left.current.instanceMatrix.needsUpdate = true;
      if (left.current.instanceColor) left.current.instanceColor.needsUpdate = true;
    }
    // right: rows in 4 columns; on progress they hop between columns by key
    if (right.current) {
      for (let i = 0; i < ROWS; i++) {
        const startCol = i % 4;
        // target column based on row id (mock hash)
        const targetCol = (i * 13) % 4;
        const col = startCol + (targetCol - startCol) * t;
        const row = Math.floor(i / 4);
        dummy.position.set(2 + col * 0.45, 1 - row * 0.32, 0);
        dummy.scale.setScalar(0.16);
        dummy.updateMatrix();
        right.current.setMatrixAt(i, dummy.matrix);
        right.current.setColorAt(i, WORKER_TINTS[targetCol]);
      }
      right.current.instanceMatrix.needsUpdate = true;
      if (right.current.instanceColor) right.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group visible={visible}>
      <instancedMesh ref={left} args={[undefined, undefined, ROWS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.3} />
      </instancedMesh>
      <instancedMesh ref={right} args={[undefined, undefined, ROWS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.3} />
      </instancedMesh>
    </group>
  );
}
