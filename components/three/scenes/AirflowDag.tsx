"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/**
 * Scene 10 — the Airflow DAG floats above the cluster.
 * Three task nodes light in sequence as the scheduler clock advances.
 * A spinning clock-hand at the left signals time, three nodes glow on cue.
 */
export function AirflowDag({ progress, visible }: Props) {
  const refs = [useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null)];
  const clockHand = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible) return;
    const order = [0.15, 0.45, 0.75];
    order.forEach((t, i) => {
      const m = refs[i].current;
      if (!m) return;
      const ratio = Math.max(0, Math.min(1, (progress - t) / 0.18));
      m.emissiveIntensity = 0.22 + ratio * 1.4;
    });
    if (clockHand.current) {
      clockHand.current.rotation.z = -progress * Math.PI * 2;
    }
  });

  const labels = ["create_cluster", "submit_job", "delete_cluster"];

  return (
    <group visible={visible} position={[0, 4.5, 0]}>
      {/* clock dial to the left */}
      <group position={[-4.8, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.55, 0.65, 32]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} />
        </mesh>
        <mesh ref={clockHand} position={[0, 0, 0.02]}>
          <boxGeometry args={[0.05, 0.5, 0.05]} />
          <meshBasicMaterial color={PALETTE.accent} toneMapped={false} />
        </mesh>
        {/* hour ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.7, Math.sin(a) * 0.7, 0]}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.6} />
            </mesh>
          );
        })}
      </group>

      {/* three DAG nodes */}
      {labels.map((label, i) => (
        <group key={label} position={[(i - 1) * 2.3, 0, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.7, 0.18]} />
            <meshStandardMaterial
              ref={refs[i]}
              color={PALETTE.bgElev}
              emissive={i === 1 ? PALETTE.accent : PALETTE.accent2}
              emissiveIntensity={0.22}
              metalness={0.4}
              roughness={0.4}
            />
          </mesh>
          {/* node base glow */}
          <mesh position={[0, -0.45, 0]}>
            <planeGeometry args={[1.7, 0.12]} />
            <meshBasicMaterial color={i === 1 ? PALETTE.accent : PALETTE.accent2} transparent opacity={0.45} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* connector arrows between */}
      {[-1.15, 1.15].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
