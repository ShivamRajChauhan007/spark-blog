"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 11 — a cluster spawns, hums with activity, then dissipates as progress crosses 0..1. */
export function EphemeralCycle({ progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!visible || !group.current) return;
    // phase 0..0.33 spawn, 0.33..0.66 work, 0.66..1.0 vaporize
    const spawn = Math.min(1, progress / 0.33);
    const work = Math.max(0, Math.min(1, (progress - 0.33) / 0.33));
    const decay = Math.max(0, (progress - 0.66) / 0.34);
    const scale = (spawn) * (1 - decay);
    group.current.scale.setScalar(scale);
    if (ringRef.current) ringRef.current.rotation.y += 0.01 + work * 0.05;
  });

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return { pos: new THREE.Vector3(Math.cos(a) * 2.2, 0, Math.sin(a) * 2.2), tint: WORKER_TINTS[i] };
    });
  }, []);

  return (
    <group ref={group} visible={visible}>
      <mesh>
        <boxGeometry args={[0.7, 0.7, 0.7]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.4} />
      </mesh>
      <group ref={ringRef}>
        {workers.map((w, i) => (
          <mesh key={i} position={w.pos}>
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial color={w.tint} emissive={w.tint} emissiveIntensity={0.3} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
