"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const LABELS = ["CREATE", "SUBMIT", "DELETE"];

/** Scene 10 — orchestration: clock dial + 3 labeled task planets in sequence. */
export function AirflowDag({ progress: _progress, visible }: Props) {
  const mats = [useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null), useRef<THREE.MeshStandardMaterial>(null)];
  const clockHand = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!visible) return;
    const t = (performance.now() * 0.00045) % 1;
    const order = [0.15, 0.45, 0.75];
    order.forEach((trigger, i) => {
      const m = mats[i].current;
      if (!m) return;
      const ratio = Math.max(0, Math.min(1, (t - trigger) / 0.18));
      m.emissiveIntensity = 0.3 + ratio * 1.7;
    });
    if (clockHand.current) clockHand.current.rotation.z = -t * Math.PI * 2;
  });

  return (
    <group visible={visible}>
      {/* clock dial above */}
      <group position={[0, 2.3, 0]}>
        <mesh>
          <ringGeometry args={[0.55, 0.66, 64]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh ref={clockHand} position={[0, 0, 0.01]}>
          <boxGeometry args={[0.06, 0.5, 0.04]} />
          <meshBasicMaterial color={PALETTE.accent} toneMapped={false} />
        </mesh>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} toneMapped={false} />
            </mesh>
          );
        })}
        <PlanetLabel position={[0, 0, 0]} text="02:00 daily" offset={-0.95} size={0.13} color="#b0b0b8" />
      </group>

      {/* three task planets */}
      {LABELS.map((label, i) => {
        const x = (i - 1) * 1.9;
        return (
          <group key={label} position={[x, 0, 0]}>
            <mesh>
              <sphereGeometry args={[0.42, 28, 28]} />
              <meshStandardMaterial
                ref={mats[i]}
                color={i === 1 ? PALETTE.accent : PALETTE.accent2}
                emissive={i === 1 ? PALETTE.accent : PALETTE.accent2}
                emissiveIntensity={0.3}
                toneMapped={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.55, 28, 28]} />
              <meshBasicMaterial
                color={i === 1 ? PALETTE.accent : PALETTE.accent2}
                transparent
                opacity={0.14}
                toneMapped={false}
                depthWrite={false}
              />
            </mesh>
            <PlanetLabel
              position={[0, 0, 0]}
              text={label}
              offset={0.78}
              size={0.16}
              color={i === 1 ? "#f4cf9c" : "#9fcef7"}
            />
          </group>
        );
      })}

      {/* connector arcs */}
      {[-0.95, 0.95].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.95, 0.018, 8, 24, Math.PI]} />
          <meshBasicMaterial color={PALETTE.fgMuted} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
