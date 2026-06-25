"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const STREAM = 150;
const SOURCE = new THREE.Vector3(-5.4, 2.1, -1.4);
const TARGET = new THREE.Vector3(0, 0, 0);

/**
 * Scene 4 — a continuous stream of data files flows out of the dataset on
 * Cloud Storage, funnels inward, and merges into the master. The lateral
 * spread shrinks to zero at the master so the stream visibly "attaches" to it.
 */
export function DataArrival({ progress: _progress, visible }: Props) {
  const streamRef = useRef<THREE.InstancedMesh>(null);
  const masterMat = useRef<THREE.MeshStandardMaterial>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: STREAM }, (_, i) => ({
        off: i / STREAM,
        ang: i * 2.39996, // golden angle, even angular spread
        rad: 0.5 + ((i * 37) % 100) / 100, // 0.5..1.5 radial jitter
        spd: 0.9 + ((i * 13) % 20) / 100 // slight per-particle speed variation
      })),
    []
  );

  useFrame(() => {
    if (!visible) return;
    const now = performance.now() * 0.0001;
    let arriving = 0;
    if (streamRef.current) {
      for (let i = 0; i < STREAM; i++) {
        const s = seeds[i];
        const p = (now * s.spd + s.off) % 1;
        const e = p * p * (3 - 2 * p); // smoothstep ease toward the master
        const x = SOURCE.x + (TARGET.x - SOURCE.x) * e;
        const y = SOURCE.y + (TARGET.y - SOURCE.y) * e;
        const z = SOURCE.z + (TARGET.z - SOURCE.z) * e;
        // converging swirl — lateral spread collapses to 0 as it reaches the master
        const spread = (1 - e) * 1.7 * s.rad;
        const lx = Math.cos(s.ang + now * 6) * spread * 0.5;
        const ly = Math.sin(s.ang) * spread;
        const lz = Math.cos(s.ang) * spread;
        dummy.position.set(x + lx, y + ly, z + lz);
        dummy.scale.setScalar(Math.max(0.012, 0.04 + (1 - e) * 0.05)); // shrink as it merges in
        dummy.updateMatrix();
        streamRef.current.setMatrixAt(i, dummy.matrix);
        if (p > 0.92) arriving++;
      }
      streamRef.current.instanceMatrix.needsUpdate = true;
    }
    // master brightens and its halo swells as data merges into it
    if (masterMat.current)
      masterMat.current.emissiveIntensity = 0.6 + Math.min(arriving, 10) * 0.05 + Math.sin(performance.now() * 0.004) * 0.1;
    if (haloRef.current)
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.min(arriving, 10) * 0.015;
  });

  return (
    <group visible={visible}>
      {/* central master, absorbing the stream */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial ref={masterMat} color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[0, 0, 0]} text="MASTER" offset={0.95} size={0.15} color="#f4cf9c" />

      {/* the dataset on Cloud Storage — where the stream is born */}
      <group position={[SOURCE.x, SOURCE.y, SOURCE.z]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.4, Math.sin(a) * 0.3, Math.sin(a) * 0.4]}>
              <boxGeometry args={[0.16, 0.16, 0.16]} />
              <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.6} toneMapped={false} />
            </mesh>
          );
        })}
        <PlanetLabel position={[0, 0, 0]} text="1 TB · orders.parquet" offset={0.9} size={0.14} color="#9fcef7" />
      </group>

      {/* the flowing data stream */}
      <instancedMesh ref={streamRef} args={[undefined, undefined, STREAM]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.85} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
