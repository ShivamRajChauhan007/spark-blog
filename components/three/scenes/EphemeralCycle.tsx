"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

/** Scene 11 — cluster materialises, hums, dissipates, on a continuous loop. */
export function EphemeralCycle({ progress: _progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return { pos: new THREE.Vector3(Math.cos(a) * 2.4, 0, Math.sin(a) * 2.4), tint: WORKER_TINTS[i] };
    });
  }, []);

  useFrame((_state, dt) => {
    if (!visible || !group.current) return;
    const t = ((performance.now() * 0.00015) % 1);
    // spawn 0..0.2, work 0.2..0.8, decay 0.8..1
    const spawn = Math.min(1, t / 0.2);
    const decay = Math.max(0, (t - 0.8) / 0.2);
    const scale = (0.5 + spawn * 0.5) * (1 - decay);
    group.current.scale.setScalar(scale);
    group.current.rotation.y += dt * 0.18;
  });

  return (
    <group ref={group} visible={visible}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {workers.map((w, i) => (
        <group key={i} position={w.pos}>
          <mesh>
            <sphereGeometry args={[0.36, 24, 24]} />
            <meshStandardMaterial color={w.tint} emissive={w.tint} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.45, 24, 24]} />
            <meshBasicMaterial color={w.tint} transparent opacity={0.12} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
