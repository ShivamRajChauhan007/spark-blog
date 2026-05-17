"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 4 — a "comet" of data approaches the system. */
export function DataArrival({ progress, visible }: Props) {
  const comet = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible || !comet.current) return;
    const t = ((progress * 1.2) % 1) || 0.001;
    // travel from -7,2,-3 to 0,0,0 along a curved path
    comet.current.position.set(-7 + t * 7, 2 - t * 2, -3 + t * 3);
    comet.current.rotation.y = t * 0.6;
    if (tail.current) {
      const m = tail.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.7 * (1 - t);
    }
  });

  return (
    <group visible={visible}>
      {/* central sun */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* comet */}
      <group ref={comet} position={[-7, 2, -3]}>
        <mesh>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial
            color={PALETTE.accent2}
            emissive={PALETTE.accent2}
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
        {/* tail — elongated capsule */}
        <mesh ref={tail} position={[-1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.1, 1.6, 8, 16]} />
          <meshBasicMaterial color={PALETTE.accent2} transparent opacity={0.6} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
