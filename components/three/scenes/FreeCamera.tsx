"use client";

import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  visible: boolean;
}

/** Scene 12 — hand the camera to the reader.
 * Renders a static cluster plus enables OrbitControls.
 * (WASD fly controls are deferred; OrbitControls is enough for v1.)
 */
export function FreeCamera({ visible }: Props) {
  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return { pos: new THREE.Vector3(Math.cos(a) * 3, 0, Math.sin(a) * 3), tint: WORKER_TINTS[i] };
    });
  }, []);

  return (
    <group visible={visible}>
      {visible && (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={20}
          enablePan={true}
        />
      )}
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.4} />
      </mesh>
      {workers.map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color={w.tint} emissive={w.tint} emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}
