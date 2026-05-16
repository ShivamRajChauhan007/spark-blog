"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 2 — fly into a single worker, reveal inner executors. */
export function WorkerCutaway({ progress, visible }: Props) {
  const outer = useRef<THREE.Mesh>(null);
  const execs = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!visible) return;
    // outer worker fades to transparent as we enter (progress -> 1)
    if (outer.current) {
      const mat = outer.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 1 - progress * 0.85;
      mat.transparent = true;
    }
    if (execs.current) {
      execs.current.scale.setScalar(0.4 + progress * 0.6);
    }
  });

  return (
    <group visible={visible} position={[3.2, 0, 0]}>
      <mesh ref={outer}>
        <boxGeometry args={[0.85, 0.85, 0.85]} />
        <meshStandardMaterial
          color={PALETTE.accent2}
          emissive={PALETTE.accent2}
          emissiveIntensity={0.25}
          metalness={0.4}
          roughness={0.5}
        />
      </mesh>

      <group ref={execs}>
        {[-0.2, 0.0, 0.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[0.5, 0.12, 0.5]} />
            <meshStandardMaterial
              color={PALETTE.fg}
              emissive={PALETTE.accent}
              emissiveIntensity={0.3 + i * 0.1}
              metalness={0.3}
              roughness={0.4}
              transparent
              opacity={0.95}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
