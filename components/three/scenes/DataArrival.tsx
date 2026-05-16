"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 4 — a 1 TB prism drifts in from off-screen left as progress grows. */
export function DataArrival({ progress, visible }: Props) {
  const prism = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible || !prism.current) return;
    // start far left (-12), settle at -1 by progress=1
    prism.current.position.x = -12 + progress * 11;
    prism.current.rotation.y = progress * 0.4;
  });

  return (
    <group visible={visible}>
      <mesh ref={prism} position={[-12, 0, 0]}>
        <boxGeometry args={[6, 0.6, 0.9]} />
        <meshStandardMaterial
          color={PALETTE.accent2}
          emissive={PALETTE.accent2}
          emissiveIntensity={0.25}
          metalness={0.5}
          roughness={0.4}
          transparent
          opacity={0.92}
        />
      </mesh>
      {/* annotation tick lines on the prism */}
      <group position={[-12 + progress * 11, 0.4, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[-2.4 + i * 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
            <meshBasicMaterial color={PALETTE.fg} transparent opacity={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
