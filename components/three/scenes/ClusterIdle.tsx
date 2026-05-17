"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 1 — a small constellation: a glowing "sun" master + 4 planet workers. */
export function ClusterIdle({ progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);
  const masterMat = useRef<THREE.MeshStandardMaterial>(null);

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 3.2;
      return {
        position: new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r),
        tint: WORKER_TINTS[i]
      };
    });
  }, []);

  useFrame((_state, dt) => {
    if (!group.current) return;
    if (visible) group.current.rotation.y += dt * (0.06 + progress * 0.15);
    if (masterMat.current) {
      masterMat.current.emissiveIntensity = 0.7 + Math.sin(performance.now() * 0.002) * 0.1 + progress * 0.2;
    }
  });

  return (
    <group ref={group} visible={visible}>
      {/* master "sun" */}
      <Planet position={[0, 0, 0]} radius={0.7} color={PALETTE.accent} matRef={masterMat} core />
      {/* worker "planets" */}
      {workers.map((w, i) => (
        <Planet key={i} position={[w.position.x, w.position.y, w.position.z]} radius={0.45} color={w.tint} />
      ))}
      {/* faint orbital ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.1, 3.16, 96]} />
        <meshBasicMaterial color={PALETTE.line} transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Shared sphere "planet" with emissive core and a translucent atmosphere halo.
 * No fancy shader — just two nested spheres + emissive material.
 */
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
          emissiveIntensity={core ? 0.7 : 0.45}
          metalness={0.15}
          roughness={0.55}
          toneMapped={false}
        />
      </mesh>
      {/* atmosphere */}
      <mesh>
        <sphereGeometry args={[radius * 1.18, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
