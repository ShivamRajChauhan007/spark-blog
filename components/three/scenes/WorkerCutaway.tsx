"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 2 — a worker planet with its inner executors revealed. */
export function WorkerCutaway({ progress, visible }: Props) {
  const outer = useRef<THREE.MeshStandardMaterial>(null);
  const exec1 = useRef<THREE.Mesh>(null);
  const exec2 = useRef<THREE.Mesh>(null);
  const exec3 = useRef<THREE.Mesh>(null);
  const orbits = useRef<THREE.Group>(null);

  useFrame((_state, dt) => {
    if (!visible) return;
    if (outer.current) {
      outer.current.opacity = 0.35 + (1 - progress) * 0.4;
      outer.current.transparent = true;
    }
    if (orbits.current) orbits.current.rotation.y += dt * 0.4;
    const t = performance.now() * 0.001;
    if (exec1.current) exec1.current.position.set(Math.cos(t * 0.9) * 0.42, 0.18, Math.sin(t * 0.9) * 0.42);
    if (exec2.current) exec2.current.position.set(Math.cos(t * 1.2 + 2) * 0.32, -0.05, Math.sin(t * 1.2 + 2) * 0.32);
    if (exec3.current) exec3.current.position.set(Math.cos(t * 0.7 + 4) * 0.5, -0.2, Math.sin(t * 0.7 + 4) * 0.5);
  });

  return (
    <group visible={visible} position={[3.2, 0, 0]}>
      {/* outer worker shell — translucent so executors show */}
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshStandardMaterial
          ref={outer}
          color={WORKER_TINTS[0]}
          emissive={WORKER_TINTS[0]}
          emissiveIntensity={0.3}
          metalness={0.2}
          roughness={0.55}
          transparent
          opacity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* inner executors */}
      <group ref={orbits}>
        <mesh ref={exec1}>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        <mesh ref={exec2}>
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
        <mesh ref={exec3}>
          <sphereGeometry args={[0.18, 20, 20]} />
          <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.85} toneMapped={false} />
        </mesh>
      </group>
      {/* atmosphere */}
      <mesh>
        <sphereGeometry args={[1.12, 32, 32]} />
        <meshBasicMaterial color={WORKER_TINTS[0]} transparent opacity={0.1} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
