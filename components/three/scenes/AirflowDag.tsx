"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 10 — Airflow DAG floats high above the cluster.
 * Three nodes light up sequentially as progress moves 0..1.
 */
export function AirflowDag({ progress, visible }: Props) {
  const refs = [useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null)];

  useFrame(() => {
    if (!visible) return;
    const lightOrder = [0.2, 0.5, 0.8];
    lightOrder.forEach((t, i) => {
      const m = refs[i].current;
      if (!m) return;
      const ratio = Math.max(0, Math.min(1, (progress - t) / 0.15));
      m.emissiveIntensity = 0.2 + ratio * 1.2;
    });
  });

  const labels = ["create_cluster", "submit_job", "delete_cluster"];

  return (
    <group visible={visible} position={[0, 4.5, 0]}>
      {labels.map((label, i) => (
        <mesh key={label} position={[(i - 1) * 2.3, 0, 0]}>
          <boxGeometry args={[1.6, 0.7, 0.18]} />
          <meshStandardMaterial
            ref={refs[i]}
            color={PALETTE.bgElev}
            emissive={i === 1 ? PALETTE.accent : PALETTE.accent2}
            emissiveIntensity={0.2}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* connector arrows between */}
      {[-1.15, 1.15].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}
