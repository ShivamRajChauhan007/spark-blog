"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel, LegendCard } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const ROWS = 40;

/** Scene 7 — NARROW (left, static) vs WIDE (right, hopping). */
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
      <mesh position={[-2.2, 0, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.55} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[-2.2, 0, 0]} text="NARROW · filter" offset={1.4} size={0.16} color="#9be8b3" />

      <mesh position={[2.2, 0, 0]}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.55} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[2.2, 0, 0]} text="WIDE · groupBy" offset={1.4} size={0.16} color="#9fcef7" />

      <instancedMesh ref={left} args={[undefined, undefined, ROWS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.5} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={right} args={[undefined, undefined, ROWS]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.5} toneMapped={false} />
      </instancedMesh>

      <LegendCard
        primary="LEGEND"
        secondary="• small dots = rows · green stays put · blue hops between columns"
      />
    </group>
  );
}
