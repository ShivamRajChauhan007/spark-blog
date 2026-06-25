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

/** Scene 4 — a "comet" of data approaches the system. */
export function DataArrival({ progress: _progress, visible }: Props) {
  const comet = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible || !comet.current) return;
    const t = (performance.now() * 0.00015) % 1;
    comet.current.position.set(-7 + t * 7, 2 - t * 2, -3 + t * 3);
    comet.current.rotation.y = t * 0.25;
    if (tail.current) {
      const m = tail.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.7 * (1 - t);
    }
  });

  return (
    <group visible={visible}>
      {/* central sun (master) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[0, 0, 0]} text="MASTER" offset={0.78} size={0.15} color="#f4cf9c" />

      {/* comet */}
      <group ref={comet} position={[-7, 2, -3]}>
        <mesh>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={1.0} toneMapped={false} />
        </mesh>
        <mesh ref={tail} position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.1, 1.6, 8, 16]} />
          <meshBasicMaterial color={PALETTE.accent2} transparent opacity={0.6} toneMapped={false} />
        </mesh>
        {/* a stream of data shards trailing behind — the "~800 files" of the dataset */}
        {Array.from({ length: 14 }).map((_, i) => {
          const d = i + 1;
          const x = -0.5 - d * 0.32;
          const y = Math.sin(i * 1.7) * 0.22;
          const z = Math.cos(i * 2.3) * 0.22;
          return (
            <mesh key={i} position={[x, y, z]}>
              <boxGeometry args={[0.11, 0.11, 0.11]} />
              <meshStandardMaterial
                color={PALETTE.accent2}
                emissive={PALETTE.accent2}
                emissiveIntensity={0.7}
                transparent
                opacity={Math.max(0.15, 0.85 - d * 0.05)}
                toneMapped={false}
              />
            </mesh>
          );
        })}
        <PlanetLabel position={[0, 0, 0]} text="1 TB · orders.parquet" offset={0.6} size={0.14} color="#9fcef7" />
      </group>
    </group>
  );
}
