"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { Planet } from "./ClusterIdle";
import { PlanetLabel, CodePanel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const SHELL = 240;

/**
 * Scene 3 — the driver sun ignites at the center of the surrounding cluster.
 * The cluster is no longer a thin ring: it's a large enveloping field of dim
 * worker cores ("the universe, listening") that the bright driver sits inside.
 */
export function DriverIgnite({ progress, visible }: Props) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const flare = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.InstancedMesh>(null);
  const shellGroup = useRef<THREE.Group>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // place the enveloping cluster shell once (fibonacci sphere, jittered radius)
  useEffect(() => {
    if (!shell.current) return;
    for (let i = 0; i < SHELL; i++) {
      const y = 1 - (i / (SHELL - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = i * Math.PI * (3 - Math.sqrt(5));
      const rad = 3.6 + (((i * 29) % 100) / 100) * 1.3; // 3.6..4.9
      dummy.position.set(Math.cos(phi) * r * rad, y * rad, Math.sin(phi) * r * rad);
      dummy.scale.setScalar(0.03 + (i % 5) * 0.01);
      dummy.updateMatrix();
      shell.current.setMatrixAt(i, dummy.matrix);
    }
    shell.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  useFrame(() => {
    if (!visible) return;
    if (mat.current) mat.current.emissiveIntensity = 0.5 + progress * 1.8 + Math.sin(performance.now() * 0.003) * 0.15;
    if (halo.current) {
      const s = 1 + progress * 0.5 + Math.sin(performance.now() * 0.002) * 0.05;
      halo.current.scale.setScalar(s);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + progress * 0.4;
    }
    if (flare.current) flare.current.rotation.z += 0.0015;
    if (shellGroup.current) shellGroup.current.rotation.y += 0.0006;
  });

  return (
    <group visible={visible}>
      <Planet position={[0, 0, 0]} radius={0.85} color={PALETTE.accent} matRef={mat} core />
      <PlanetLabel position={[0, 0, 0]} text="DRIVER · spark-submit" offset={1.25} size={0.2} color="#f4cf9c" />

      <mesh ref={halo}>
        <sphereGeometry args={[1.3, 32, 32]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.22} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={flare} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.55, 128]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>

      {/* the surrounding cluster — a large enveloping field of dim worker cores, listening */}
      <group ref={shellGroup}>
        <instancedMesh ref={shell} args={[undefined, undefined, SHELL]}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#6f86c9" transparent opacity={0.5} toneMapped={false} />
        </instancedMesh>
      </group>

      <CodePanel
        position={[0, -2.6, 0]}
        code={`spark-submit \\\n  --deploy-mode cluster \\\n  --executor-cores 4 \\\n  --executor-memory 11g \\\n  --num-executors 8`}
        width={3.6}
      />
    </group>
  );
}
