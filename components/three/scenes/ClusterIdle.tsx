"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/**
 * Scene 1 — the idle cluster.
 * Master cube at origin, 4 worker cubes on a circle of radius 3.
 * Network "lines" are thin cylinders (avoids r3f v9 line-element JSX typing pain).
 * Scroll progress controls orbit speed: the cluster "wakes up" as you read.
 */
export function ClusterIdle({ progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);
  const masterRef = useRef<THREE.MeshStandardMaterial>(null);

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 3;
      return {
        position: new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r),
        tint: WORKER_TINTS[i]
      };
    });
  }, []);

  useFrame((_state, dt) => {
    if (!group.current) return;
    if (visible) {
      // orbit speed scales with progress: idle → awake
      group.current.rotation.y += dt * (0.04 + progress * 0.18);
    }
    if (masterRef.current) {
      // breathing emissive — the master "thinks"
      masterRef.current.emissiveIntensity = 0.35 + Math.sin(performance.now() * 0.002) * 0.07 + progress * 0.2;
    }
  });

  return (
    <group ref={group} visible={visible}>
      {/* master */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          ref={masterRef}
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.4}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>

      {workers.map((w, i) => (
        <WorkerNode key={i} position={w.position} tint={w.tint} />
      ))}

      {/* floor grid */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20, 20, 20]} />
        <meshBasicMaterial color={PALETTE.line} wireframe transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

function WorkerNode({ position, tint }: { position: THREE.Vector3; tint: THREE.Color }) {
  // distance from origin (master) for line length
  const len = position.length();
  // direction angle on Y axis
  const angle = Math.atan2(position.x, position.z);

  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial
          color={tint}
          emissive={tint}
          emissiveIntensity={0.3}
          metalness={0.35}
          roughness={0.5}
        />
      </mesh>
      {/* network "cable" toward master — thin cylinder pointing along -position */}
      <group rotation={[0, angle, 0]}>
        <mesh position={[0, 0, -len / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, len, 8, 1]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}
