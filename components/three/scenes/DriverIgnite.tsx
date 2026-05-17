"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { Planet } from "./ClusterIdle";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 3 — the master sun ignites; a single bright flare halo grows. */
export function DriverIgnite({ progress, visible }: Props) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const flare = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible) return;
    if (mat.current) {
      mat.current.emissiveIntensity = 0.4 + progress * 1.6 + Math.sin(performance.now() * 0.003) * 0.1;
    }
    if (halo.current) {
      const s = 1 + progress * 0.5 + Math.sin(performance.now() * 0.002) * 0.04;
      halo.current.scale.setScalar(s);
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 + progress * 0.4;
    }
    if (flare.current) {
      flare.current.rotation.z += 0.003;
    }
  });

  return (
    <group visible={visible}>
      <Planet position={[0, 0, 0]} radius={0.85} color={PALETTE.accent} matRef={mat} core />
      {/* outer flare halo */}
      <mesh ref={halo}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* flare disc */}
      <mesh ref={flare} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 96]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}
