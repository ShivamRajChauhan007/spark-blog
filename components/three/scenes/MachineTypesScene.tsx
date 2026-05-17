"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

interface MachineSpec {
  family: string;
  detail: string;
  position: [number, number, number];
  radius: number; // visual = relative size of the planet (proportional to memory)
  color: string;
}

/**
 * Scene 12 — Machine types.
 * A row of representative Dataproc machine planets, sized by their memory.
 * The "recommended" planet (n2-highmem-8) gets a subtle pulsing glow ring.
 */
const MACHINES: MachineSpec[] = [
  { family: "E2", detail: "dev / cheap", position: [-4.5, 0, 0], radius: 0.32, color: "#9be8b3" },
  { family: "N2", detail: "default", position: [-2.3, 0, 0], radius: 0.45, color: "#9fcef7" },
  { family: "n2-highmem-8", detail: "★ Spark workhorse", position: [0, 0, 0], radius: 0.62, color: "#f4cf9c" },
  { family: "C3", detail: "compute-bound", position: [2.3, 0, 0], radius: 0.48, color: "#c8dfff" },
  { family: "M2", detail: "memory beast", position: [4.5, 0, 0], radius: 0.78, color: "#dca0e6" }
];

export function MachineTypesScene({ progress: _progress, visible }: Props) {
  const recommendedRing = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!visible) return;
    const t = performance.now() * 0.001;
    if (recommendedRing.current && ringMat.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      recommendedRing.current.scale.setScalar(pulse);
      ringMat.current.opacity = 0.45 + Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group visible={visible}>
      <PlanetLabel
        position={[0, 0, 0]}
        text="DATAPROC MACHINE FAMILIES"
        offset={2.5}
        size={0.2}
        color="#f4cf9c"
      />
      <PlanetLabel
        position={[0, 0, 0]}
        text="size ∝ memory · star = recommended for Spark"
        offset={2.1}
        size={0.12}
        color="#b0b0b8"
      />

      {MACHINES.map((m, i) => (
        <group key={i} position={m.position}>
          {/* main planet */}
          <mesh>
            <sphereGeometry args={[m.radius, 32, 32]} />
            <meshStandardMaterial
              color={m.color}
              emissive={m.color}
              emissiveIntensity={0.55}
              metalness={0.15}
              roughness={0.5}
              toneMapped={false}
            />
          </mesh>
          {/* atmosphere */}
          <mesh>
            <sphereGeometry args={[m.radius * 1.18, 32, 32]} />
            <meshBasicMaterial color={m.color} transparent opacity={0.13} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* recommended ring on n2-highmem-8 */}
          {m.family === "n2-highmem-8" && (
            <mesh ref={recommendedRing} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[m.radius * 1.4, m.radius * 1.46, 96]} />
              <meshBasicMaterial
                ref={ringMat}
                color={PALETTE.accent}
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
                toneMapped={false}
              />
            </mesh>
          )}
          <PlanetLabel position={[0, 0, 0]} text={m.family} offset={m.radius + 0.35} size={0.16} color="#f4f4f5" />
          <PlanetLabel position={[0, 0, 0]} text={m.detail} offset={-(m.radius + 0.35)} size={0.12} color="#b0b0b8" />
        </group>
      ))}
    </group>
  );
}
