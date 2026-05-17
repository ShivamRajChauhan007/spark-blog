"use client";

import { Billboard, Html, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { ReactNode, useRef } from "react";
import * as THREE from "three";

/**
 * Shared font URL — one SDF atlas across all scenes (drei caches by URL).
 * Geist Mono is loaded by the page anyway, so the network cost is amortised.
 */
const FONT_MONO = "https://fonts.gstatic.com/s/geistmono/v3/or3yQ6H-1_WfwkMZI_qYPLs1ZjOQ-tIH.woff2";

/** Floating planet/element label that always faces the camera. Adapts to mobile. */
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
  const { size: vp } = useThree();
  const compact = vp.width > 0 && vp.width < 600;
  const fs = Math.max(compact ? 0.18 : size, size);
  return (
    <Text
      position={[position[0], position[1] + offset, position[2]]}
      fontSize={fs}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={fs * 0.06}
      outlineColor="#08090e"
      outlineOpacity={0.95}
      letterSpacing={0.08}
      maxWidth={3}
    >
      {text.toUpperCase()}
    </Text>
  );
}

/**
 * 3D info card — Billboard so it faces the camera, with a frosted plane
 * backdrop behind two lines of text. Anchored to a world point.
 */
export function InfoCard({
  position,
  primary,
  secondary,
  offset = [0, 1, 0],
  color = "#f4cf9c"
}: {
  position: [number, number, number];
  primary: string;
  secondary?: string;
  offset?: [number, number, number];
  color?: string;
}) {
  const { size: vp } = useThree();
  const compact = vp.width > 0 && vp.width < 600;
  const primaryFS = compact ? 0.2 : 0.16;
  const secondaryFS = compact ? 0.13 : 0.11;
  const cardW = compact ? 2.4 : 2.6;
  const cardH = secondary ? (compact ? 0.7 : 0.62) : (compact ? 0.42 : 0.34);
  const px = position[0] + offset[0];
  const py = position[1] + offset[1];
  const pz = position[2] + offset[2];
  return (
    <Billboard position={[px, py, pz]}>
      <mesh>
        <planeGeometry args={[cardW, cardH]} />
        <meshBasicMaterial color="#0c0d12" transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[cardW, 0.012]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <Text
        position={[0, secondary ? 0.1 : 0, 0.002]}
        fontSize={primaryFS}
        color={color}
        anchorX="center"
        anchorY="middle"
        font={FONT_MONO}
        letterSpacing={0.04}
        maxWidth={cardW - 0.2}
      >
        {primary.toUpperCase()}
      </Text>
      {secondary && (
        <Text
          position={[0, -0.13, 0.002]}
          fontSize={secondaryFS}
          color="#d2d2d6"
          anchorX="center"
          anchorY="middle"
          font={FONT_MONO}
          letterSpacing={0.02}
          maxWidth={cardW - 0.2}
        >
          {secondary}
        </Text>
      )}
    </Billboard>
  );
}

/**
 * Top-corner HUD overlay — DOM text, screen-anchored, crisp at any DPR.
 * Pass any ReactNode; use Tailwind classes for typography consistency.
 */
export function HudOverlay({
  position = "top-left",
  children
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  children: ReactNode;
}) {
  const corners = {
    "top-left": "top-3 left-3",
    "top-right": "top-3 right-3",
    "bottom-left": "bottom-3 left-3",
    "bottom-right": "bottom-3 right-3"
  };
  return (
    <Html
      transform={false}
      prepend={false}
      wrapperClass="pointer-events-none"
      className={`pointer-events-none fixed ${corners[position]} z-10`}
    >
      <div className="rounded border border-[var(--color-line)]/60 bg-[var(--color-bg)]/80 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] backdrop-blur">
        {children}
      </div>
    </Html>
  );
}

/** Code-snippet panel in 3D, world-anchored. Used by ActionTriggerScene + Driver. */
export function CodePanel({
  position,
  code,
  width = 3.4
}: {
  position: [number, number, number];
  code: string;
  width?: number;
}) {
  const lines = code.split("\n");
  const lineHeight = 0.16;
  const padding = 0.18;
  const height = lines.length * lineHeight + padding * 2;
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#0c0d12" transparent opacity={0.88} depthWrite={false} />
      </mesh>
      <mesh position={[0, height / 2 - 0.01, 0.001]}>
        <planeGeometry args={[width, 0.02]} />
        <meshBasicMaterial color="#e89856" toneMapped={false} />
      </mesh>
      {lines.map((line, i) => (
        <Text
          key={i}
          position={[-(width / 2) + padding + 0.05, height / 2 - padding - 0.06 - i * lineHeight, 0.002]}
          fontSize={0.12}
          color="#eaeaf0"
          anchorX="left"
          anchorY="middle"
          font={FONT_MONO}
          letterSpacing={0.02}
          maxWidth={width - padding * 2}
        >
          {line}
        </Text>
      ))}
    </Billboard>
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
        const r = radius + Math.sin(i * 13.7) * thickness;
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
export function PulsingGlow({
  color,
  base = 0.5,
  amplitude = 0.25,
  speed = 1.8
}: {
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
