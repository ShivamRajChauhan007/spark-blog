"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 3 — the driver wakes on the master node. Emissive intensity ramps as progress grows. */
export function DriverIgnite({ progress, visible }: Props) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible) return;
    if (mat.current) {
      mat.current.emissiveIntensity = 0.2 + progress * 1.4;
    }
    if (halo.current) {
      const s = 1 + progress * 0.8 + Math.sin(performance.now() * 0.002) * 0.05;
      halo.current.scale.setScalar(s);
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.2 + progress * 0.5;
    }
  });

  return (
    <group visible={visible}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshStandardMaterial
          ref={mat}
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.2}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>

      <mesh ref={halo} position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 28, 28]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
}
