"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { PlanetLabel, LegendCard } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const N = 96;

/** Scene 5 — the data shattered into partition motes around the master. */
export function PartitionShatter({ progress: _progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const targets = useMemo(() => {
    return Array.from({ length: N }, (_, i) => {
      const theta = (i * 12.9898) % (Math.PI * 2);
      const phi = ((i * 78.233) % Math.PI) - Math.PI / 2;
      const r = 2.5 + ((i * 31) % 11) * 0.08;
      return new THREE.Vector3(
        Math.cos(theta) * Math.cos(phi) * r,
        Math.sin(phi) * r,
        Math.sin(theta) * Math.cos(phi) * r
      );
    });
  }, []);

  useFrame(() => {
    if (!visible || !meshRef.current) return;
    const t = (Math.sin(performance.now() * 0.0003) * 0.5 + 0.5);
    const e = t * t * (3 - 2 * t);
    for (let i = 0; i < N; i++) {
      const target = targets[i];
      const drift = Math.sin(performance.now() * 0.0008 + i * 0.7) * 0.07;
      dummy.position.copy(target).multiplyScalar(e).setY(target.y * e + drift);
      dummy.scale.setScalar(0.07 + Math.sin(i * 0.3) * 0.02);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[0, 0, 0]} text="~8,000 PARTITIONS" offset={3.0} size={0.18} color="#9fcef7" />
      <PlanetLabel position={[0, 0, 0]} text="128 MB EACH" offset={2.65} size={0.14} color="#c8dfff" />

      <instancedMesh ref={meshRef} args={[undefined, undefined, N]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color={PALETTE.accent2} emissive={PALETTE.accent2} emissiveIntensity={0.75} toneMapped={false} />
      </instancedMesh>

      <LegendCard primary="LEGEND" secondary="• each blue dot = one 128 MB partition · ~6-12 M rows" />
    </group>
  );
}
