"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 9 — three glowing orbital "stage" rings, one fading into the next. */
export function StagesDiagram({ progress: _progress, visible }: Props) {
  const g = useRef<THREE.Group>(null);
  const rings = [useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null), useRef<THREE.MeshBasicMaterial>(null)];

  useFrame(() => {
    if (!visible || !g.current) return;
    g.current.rotation.y += 0.002;
    const t = (performance.now() * 0.0006) % 3;
    for (let i = 0; i < 3; i++) {
      const m = rings[i].current;
      if (!m) continue;
      const dist = Math.abs(t - i);
      m.opacity = 0.35 + Math.max(0, 1 - dist) * 0.55;
    }
  });

  return (
    <group ref={g} visible={visible}>
      {[1.4, 2.0, 2.6].map((radius, i) => (
        <group key={i} rotation={[Math.PI / 2.4, 0, 0]}>
          <mesh>
            <ringGeometry args={[radius - 0.04, radius, 96]} />
            <meshBasicMaterial
              ref={rings[i]}
              color={i === 1 ? PALETTE.accent : PALETTE.accent2}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          {/* stage planet */}
          <mesh position={[radius, 0, 0]}>
            <sphereGeometry args={[0.22, 20, 20]} />
            <meshStandardMaterial
              color={i === 1 ? PALETTE.accent : PALETTE.accent2}
              emissive={i === 1 ? PALETTE.accent : PALETTE.accent2}
              emissiveIntensity={0.6}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {/* central master */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}
