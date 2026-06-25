"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { Planet } from "./ClusterIdle";
import { PlanetLabel, DustRing, CodePanel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 3 — the driver sun ignites. */
export function DriverIgnite({ progress, visible }: Props) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const flare = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible) return;
    if (mat.current) {
      mat.current.emissiveIntensity = 0.5 + progress * 1.8 + Math.sin(performance.now() * 0.003) * 0.15;
    }
    if (halo.current) {
      const s = 1 + progress * 0.5 + Math.sin(performance.now() * 0.002) * 0.05;
      halo.current.scale.setScalar(s);
      const m = halo.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.22 + progress * 0.4;
    }
    if (flare.current) flare.current.rotation.z += 0.0015;
  });

  return (
    <group visible={visible}>
      <Planet position={[0, 0, 0]} radius={0.85} color={PALETTE.accent} matRef={mat} core />
      <PlanetLabel position={[0, 0, 0]} text="DRIVER · spark-submit" offset={1.25} size={0.2} color="#f4cf9c" />

      <mesh ref={halo}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flare} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 128]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <DustRing radius={1.7} count={80} color={PALETTE.accent} thickness={0.06} speed={0.3} />
      <CodePanel
        position={[0, -2.6, 0]}
        code={`spark-submit \\\n  --deploy-mode cluster \\\n  --executor-cores 4 \\\n  --executor-memory 11g \\\n  --num-executors 8`}
        width={3.6}
      />
    </group>
  );
}
