"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel, DustRing } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 1 — small constellation: master "sun" + 4 worker planets, labeled. */
export function ClusterIdle({ progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);
  const masterMat = useRef<THREE.MeshStandardMaterial>(null);

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 3.2;
      return {
        position: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
        tint: WORKER_TINTS[i],
        label: `WORKER ${i + 1}`
      };
    });
  }, []);

  useFrame((_state, dt) => {
    if (!group.current) return;
    if (visible) group.current.rotation.y += dt * (0.06 + progress * 0.15);
    if (masterMat.current) {
      masterMat.current.emissiveIntensity =
        0.7 + Math.sin(performance.now() * 0.002) * 0.12 + progress * 0.2;
    }
  });

  return (
    <group ref={group} visible={visible}>
      {/* master "sun" */}
      <Planet
        position={[0, 0, 0]}
        radius={0.7}
        color={PALETTE.accent}
        matRef={masterMat}
        core
      />
      <PlanetLabel position={[0, 0, 0]} text="MASTER" offset={1.05} size={0.2} color="#f4cf9c" />
      {/* dust ring around the sun */}
      <DustRing radius={1.15} count={60} color={PALETTE.accent} thickness={0.04} speed={0.25} />

      {/* worker "planets" */}
      {workers.map((w, i) => (
        <group key={i}>
          <Planet position={w.position} radius={0.45} color={w.tint} />
          <PlanetLabel
            position={w.position}
            text={w.label}
            offset={0.72}
            size={0.15}
            color="#c8dfff"
          />
        </group>
      ))}
      {/* faint orbital ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.1, 3.18, 128]} />
        <meshBasicMaterial color={PALETTE.line} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Planet({
  position,
  radius,
  color,
  matRef,
  core = false
}: {
  position: [number, number, number];
  radius: number;
  color: THREE.Color;
  matRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  core?: boolean;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={core ? 0.8 : 0.5}
          metalness={0.15}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.18, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.35, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
