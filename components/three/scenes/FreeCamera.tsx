"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";

interface Props {
  visible: boolean;
}

/** Scene 12 — larger system: 8 planets + drifting partition motes. */
export function FreeCamera({ visible }: Props) {
  const mote = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const ring = useRef<THREE.Group>(null);

  const workers = useMemo(() => {
    const arr: Array<{ pos: THREE.Vector3; tint: THREE.Color; r: number }> = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const r = i % 2 === 0 ? 3.5 : 5.0;
      arr.push({
        pos: new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r),
        tint: WORKER_TINTS[i % 4],
        r
      });
    }
    return arr;
  }, []);

  const motes = useMemo(() => {
    return Array.from({ length: 180 }, (_, i) => ({
      base: new THREE.Vector3(
        (Math.sin(i * 13.7) * 0.5 + 0.5) * 16 - 8,
        (Math.sin(i * 7.3) * 0.5 + 0.5) * 5 - 1,
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
    if (ring.current) ring.current.rotation.y += 0.0015;
  });

  return (
    <group visible={visible}>
      {/* central master */}
      <mesh>
        <sphereGeometry args={[0.8, 36, 36]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.0, 36, 36]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.14} toneMapped={false} depthWrite={false} />
      </mesh>
      <group ref={ring}>
        {workers.map((w, i) => (
          <group key={i} position={w.pos}>
            <mesh>
              <sphereGeometry args={[0.42, 28, 28]} />
              <meshStandardMaterial color={w.tint} emissive={w.tint} emissiveIntensity={0.45} toneMapped={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.52, 28, 28]} />
              <meshBasicMaterial color={w.tint} transparent opacity={0.12} toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        ))}
      </group>
      <instancedMesh ref={mote} args={[undefined, undefined, motes.length]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.5} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
