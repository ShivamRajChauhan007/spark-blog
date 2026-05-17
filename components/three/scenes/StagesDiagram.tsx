"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 9 — three "stage" panels float above the cluster, joined by shuffle arrows. */
export function StagesDiagram({ progress, visible }: Props) {
  const g = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!visible || !g.current) return;
    g.current.position.y = 2.5 - 0.2 * Math.sin(progress * Math.PI);
  });

  return (
    <group ref={g} visible={visible} position={[0, 2.5, 0]}>
      {[-3, 0, 3].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[2, 1, 0.1]} />
          <meshStandardMaterial
            color={PALETTE.bgElev}
            emissive={i === 1 ? PALETTE.accent : PALETTE.accent2}
            emissiveIntensity={0.25 + (i === 1 ? progress * 0.4 : 0)}
            metalness={0.4}
            roughness={0.4}
          />
        </mesh>
      ))}
      {/* connector arrows */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}
