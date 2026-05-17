"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  visible: boolean;
}

/**
 * Scene 12 — fly mode. Larger cluster than the hero (more workers + drifting
 * partition motes) so the finale rewards the scroller. OrbitControls hand-off.
 */
export function FreeCamera({ visible }: Props) {
  const mote = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 8 workers in two concentric rings — bigger than the hero (4)
  const workers = useMemo(() => {
    const arr: Array<{ pos: THREE.Vector3; tint: THREE.Color }> = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r = i % 2 === 0 ? 3.5 : 5.5;
      arr.push({ pos: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), tint: WORKER_TINTS[i % 4] });
    }
    return arr;
  }, []);

  // 200 drifting partition motes for atmosphere
  const motes = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      base: new THREE.Vector3(
        (Math.sin(i * 13.7) * 0.5 + 0.5) * 16 - 8,
        (Math.sin(i * 7.3) * 0.5 + 0.5) * 6 - 1,
        (Math.sin(i * 19.1) * 0.5 + 0.5) * 16 - 8
      ),
      phase: i * 0.137
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!visible || !mote.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const drift = Math.sin(t * 0.4 + m.phase) * 0.15;
      dummy.position.set(m.base.x, m.base.y + drift, m.base.z);
      dummy.scale.setScalar(0.04 + ((i * 7) % 5) * 0.012);
      dummy.updateMatrix();
      mote.current.setMatrixAt(i, dummy.matrix);
    }
    mote.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      {visible && (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={30}
          enablePan={true}
          autoRotate
          autoRotateSpeed={0.4}
        />
      )}
      <mesh>
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.5}
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>
      {workers.map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color={w.tint} emissive={w.tint} emissiveIntensity={0.32} />
        </mesh>
      ))}
      <instancedMesh ref={mote} args={[undefined, undefined, motes.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.5} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
