"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

const ROWS = 40;

/** Scene 7 — two side-by-side mini systems. Left: narrow (no movement). Right: wide (hopping). */
export function NarrowVsWide({ progress: _progress, visible }: Props) {
  const left = useRef<THREE.InstancedMesh>(null);
  const right = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    if (!visible) return;
    const t = (performance.now() * 0.0004) % 1;
    if (left.current) {
      for (let i = 0; i < ROWS; i++) {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const a = (col / 4) * Math.PI * 2;
        dummy.position.set(-2.2 + Math.cos(a) * 0.9, 0.7 - row * 0.28, Math.sin(a) * 0.9);
        dummy.scale.setScalar(0.13);
        dummy.updateMatrix();
        left.current.setMatrixAt(i, dummy.matrix);
        const keep = ((i + Math.floor(t * 6)) % 3) === 0;
        left.current.setColorAt(i, keep ? PALETTE.success : PALETTE.line);
      }
      left.current.instanceMatrix.needsUpdate = true;
      if (left.current.instanceColor) left.current.instanceColor.needsUpdate = true;
    }
    if (right.current) {
      for (let i = 0; i < ROWS; i++) {
        const startCol = i % 4;
        const targetCol = (i * 13) % 4;
        const col = startCol + (targetCol - startCol) * t;
        const row = Math.floor(i / 4);
        const a = (col / 4) * Math.PI * 2;
        dummy.position.set(2.2 + Math.cos(a) * 0.9, 0.7 - row * 0.28, Math.sin(a) * 0.9);
        dummy.scale.setScalar(0.13);
        dummy.updateMatrix();
        right.current.setMatrixAt(i, dummy.matrix);
        tmpColor.copy(WORKER_TINTS[targetCol]);
        right.current.setColorAt(i, tmpColor);
      }
      right.current.instanceMatrix.needsUpdate = true;
      if (right.current.instanceColor) right.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group visible={visible}>
      {/* anchors */}
      <mesh position={[-2.2, 0, 0]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.45} toneMapped={false} />
      </mesh>
      <mesh position={[2.2, 0, 0]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.45} toneMapped={false} />
      </mesh>
      <instancedMesh ref={left} args={[undefined, undefined, ROWS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.45} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={right} args={[undefined, undefined, ROWS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.45} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
