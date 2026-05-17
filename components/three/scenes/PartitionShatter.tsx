"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";

interface Props {
  progress: number;
  visible: boolean;
}

const N = 64; // visible partition cubes (we *say* 8000 in copy)

/** Scene 5 — the data prism shatters into N partitions. */
export function PartitionShatter({ progress, visible }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // pre-compute target positions on a 4x4x4 cube grid centred at origin
  const targets = useMemo(() => {
    const side = Math.ceil(Math.cbrt(N));
    const ts: Array<[number, number, number]> = [];
    for (let i = 0; i < N; i++) {
      const x = i % side;
      const y = Math.floor(i / side) % side;
      const z = Math.floor(i / (side * side));
      ts.push([(x - side / 2) * 0.45, (y - side / 2) * 0.45 + 0.5, (z - side / 2) * 0.45]);
    }
    return ts;
  }, []);

  // start positions: lined up as the prism, x from -3 to +3
  const starts = useMemo(() => {
    return Array.from({ length: N }, (_, i): [number, number, number] => [-3 + (i / N) * 6, 0, 0]);
  }, []);

  useFrame(() => {
    if (!visible || !meshRef.current) return;
    const t = progress;
    const e = t * t * (3 - 2 * t);
    for (let i = 0; i < N; i++) {
      const [sx, sy, sz] = starts[i];
      const [tx, ty, tz] = targets[i];
      const x = sx + (tx - sx) * e;
      const y = sy + (ty - sy) * e;
      const z = sz + (tz - sz) * e;
      dummy.position.set(x, y, z);
      dummy.rotation.set(t * 1.2 * ((i % 7) - 3) * 0.3, t * 1.4 * ((i % 5) - 2) * 0.3, 0);
      const s = 0.22 - t * 0.04;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group visible={visible}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, N]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={PALETTE.accent2}
          emissive={PALETTE.accent2}
          emissiveIntensity={0.4}
          metalness={0.45}
          roughness={0.35}
        />
      </instancedMesh>
    </group>
  );
}
