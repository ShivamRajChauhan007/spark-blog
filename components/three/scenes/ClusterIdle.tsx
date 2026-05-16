"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number; // local 0..1
  visible: boolean;
}

/**
 * Scene 1 — the idle cluster.
 * Master cube at origin, 4 worker cubes on a circle of radius 3.
 * Faint network lines between them; subtle bloom-friendly emissive.
 */
export function ClusterIdle({ progress: _progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r = 3;
      return {
        position: [Math.cos(angle) * r, 0, Math.sin(angle) * r] as [number, number, number],
        tint: WORKER_TINTS[i]
      };
    });
  }, []);

  useFrame((_state, dt) => {
    if (!group.current) return;
    if (visible) group.current.rotation.y += dt * 0.08;
  });

  return (
    <group ref={group} visible={visible}>
      {/* master */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.35}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>

      {/* workers */}
      {workers.map((w, i) => (
        <group key={i} position={w.position}>
          <mesh>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial
              color={w.tint}
              emissive={w.tint}
              emissiveIntensity={0.25}
              metalness={0.35}
              roughness={0.5}
            />
          </mesh>
          {/* network line from this worker to master */}
          <line>
            <bufferGeometry
              attach="geometry"
              onUpdate={(geom: THREE.BufferGeometry) => {
                const pts = new Float32Array([0, 0, 0, -w.position[0], 0, -w.position[2]]);
                geom.setAttribute("position", new THREE.BufferAttribute(pts, 3));
              }}
            />
            {/* @ts-expect-error - r3f line material */}
            <lineBasicMaterial color={PALETTE.line} transparent opacity={0.5} />
          </line>
        </group>
      ))}

      {/* floor grid hint */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20, 20, 20]} />
        <meshBasicMaterial color={PALETTE.line} wireframe transparent opacity={0.06} />
      </mesh>
    </group>
  );
}
