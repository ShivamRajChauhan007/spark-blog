"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel, DustRing, InfoCard } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

/**
 * Scene 1 — small constellation: master "sun" + 4 worker planets, labeled.
 * Workers now have a subtle activity pulse + small orbiting "core threads"
 * so the cluster looks alive (computation happening).
 */
export function ClusterIdle({ progress, visible }: Props) {
  const group = useRef<THREE.Group>(null);
  const masterMat = useRef<THREE.MeshStandardMaterial>(null);

  const workers = useMemo(() => {
    return Array.from({ length: 4 }, (_, i) => ({
      angle: (i / 4) * Math.PI * 2 + Math.PI / 4,
      r: 3.2,
      tint: WORKER_TINTS[i],
      label: `WORKER ${i + 1}`,
      activityOffset: i * 0.7
    }));
  }, []);

  useFrame((_state, dt) => {
    if (!group.current) return;
    if (visible) group.current.rotation.y += dt * (0.025 + progress * 0.06);
    if (masterMat.current) {
      masterMat.current.emissiveIntensity =
        0.7 + Math.sin(performance.now() * 0.002) * 0.12 + progress * 0.2;
    }
  });

  return (
    <group ref={group} visible={visible}>
      {/* Scene title — the whole assembly is one cluster */}
      <PlanetLabel
        position={[0, 3.15, 0]}
        text="DATAPROC CLUSTER"
        offset={0}
        size={0.18}
        color="#f4f4f5"
      />

      {/* master "sun" */}
      <Planet position={[0, 0, 0]} radius={0.7} color={PALETTE.accent} matRef={masterMat} core />
      <PlanetLabel position={[0, 0, 0]} text="MASTER" offset={1.05} size={0.2} color="#f4cf9c" />
      <DustRing radius={1.15} count={60} color={PALETTE.accent} thickness={0.04} speed={0.12} />

      {/* Centered vertical-stack InfoCards — top: fleet of workers; bottom: master. */}
      <InfoCard
        position={[0, 0, 0]}
        offset={[0, 2.35, 0]}
        primary="FLEET · 4 × n2-highmem-8"
        secondary="32 vCPU · 256 GB · ~$2.65/hr"
        color="#c8dfff"
      />
      <InfoCard
        position={[0, 0, 0]}
        offset={[0, -2.35, 0]}
        primary="MASTER · n2-standard-4"
        secondary="4 vCPU · 16 GB · $0.19/hr"
        color="#f4cf9c"
      />

      {/* worker "planets" */}
      {workers.map((w, i) => (
        <ActiveWorker
          key={i}
          angle={w.angle}
          orbitRadius={w.r}
          tint={w.tint}
          label={w.label}
          phase={w.activityOffset}
        />
      ))}

      {/* faint orbital ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.1, 3.18, 128]} />
        <meshBasicMaterial color={PALETTE.line} transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function ActiveWorker({
  angle,
  orbitRadius,
  tint,
  label,
  phase
}: {
  angle: number;
  orbitRadius: number;
  tint: THREE.Color;
  label: string;
  phase: number;
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const threads = useRef<THREE.Group>(null);
  const position: [number, number, number] = [
    Math.cos(angle) * orbitRadius,
    0,
    Math.sin(angle) * orbitRadius
  ];

  useFrame((_state, dt) => {
    // pulsing activity — random-looking but deterministic per-worker
    if (mat.current) {
      const t = performance.now() * 0.001 + phase;
      const burst = Math.max(0, Math.sin(t * 0.7)) * 0.35;
      mat.current.emissiveIntensity = 0.45 + burst;
    }
    if (threads.current) threads.current.rotation.y += dt * 0.9;
  });

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial
          ref={mat}
          color={tint}
          emissive={tint}
          emissiveIntensity={0.5}
          metalness={0.15}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial color={tint} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshBasicMaterial color={tint} transparent opacity={0.06} depthWrite={false} toneMapped={false} />
      </mesh>

      {/* fast inner thread ring */}
      <group ref={threads}>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55]}>
              <sphereGeometry args={[0.025, 8, 8]} />
              <meshBasicMaterial color={tint} transparent opacity={0.9} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      <PlanetLabel position={[0, 0, 0]} text={label} offset={0.78} size={0.14} color="#c8dfff" />
    </group>
  );
}

export function Planet({
  position,
  radius,
  color,
  matRef,
  core = false
}: {
  position: [number, number, number];
  radius: number;
  color: THREE.Color;
  matRef?: React.RefObject<THREE.MeshStandardMaterial | null>;
  core?: boolean;
}) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={core ? 0.8 : 0.5}
          metalness={0.15}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.18, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.35, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
