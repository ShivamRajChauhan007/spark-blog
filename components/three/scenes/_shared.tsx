"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/** Floating label that always faces the camera. Used everywhere. */
export function PlanetLabel({
  position,
  text,
  offset = 0.9,
  size = 0.18,
  color = "#f4f4f5"
}: {
  position: [number, number, number];
  text: string;
  offset?: number;
  size?: number;
  color?: string;
}) {
  return (
    <Text
      position={[position[0], position[1] + offset, position[2]]}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={size * 0.06}
      outlineColor="#08090e"
      outlineOpacity={0.95}
      letterSpacing={0.08}
      maxWidth={3}
    >
      {text.toUpperCase()}
    </Text>
  );
}

/** A small dust/particle ring around a planet — adds "alive" quality. */
export function DustRing({
  radius,
  count = 80,
  color,
  thickness = 0.06,
  speed = 0.4
}: {
  radius: number;
  count?: number;
  color: THREE.Color;
  thickness?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_state, dt) => {
    if (ref.current) ref.current.rotation.y += dt * speed;
  });
  return (
    <group ref={ref}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = radius + (Math.sin(i * 13.7) * thickness);
        const y = Math.sin(i * 7.3) * thickness * 0.5;
        return (
          <mesh key={i} position={[Math.cos(a) * r, y, Math.sin(a) * r]}>
            <sphereGeometry args={[0.015 + (i % 3) * 0.005, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.7} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Pulsing emissive sun — call this for the master/driver. */
export function PulsingGlow({ color, base = 0.5, amplitude = 0.25, speed = 1.8 }: {
  color: THREE.Color;
  base?: number;
  amplitude?: number;
  speed?: number;
}) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    if (mat.current) {
      const t = performance.now() * 0.001 * speed;
      mat.current.opacity = base + Math.sin(t) * amplitude;
    }
  });
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={base} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
