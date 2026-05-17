"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { CodePanel, InfoCard, PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

/**
 * Scene 5 — `.count()` action trigger.
 * The lazy DataFrame from Scene 4 wakes up. A code panel shows `df.count()`,
 * a pulse travels from the panel to the driver, the driver emits radial
 * "stage 0" rays toward each worker, then transitions to partition shatter.
 *
 * Beat timing (10s loop):
 *   0.0 – 1.5s  Dormant: code panel fades in, driver dim
 *   1.5 – 3.0s  Pulse from code panel → driver; driver lights up
 *   3.0 – 7.0s  Driver emits 8 radial "stage 0" rays toward workers
 *   7.0 – 10.0s HUD ticker counts up tasks 0 → 8,000
 */
export function ActionTriggerScene({ progress: _progress, visible }: Props) {
  const driverMat = useRef<THREE.MeshStandardMaterial>(null);
  const driverHalo = useRef<THREE.Mesh>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const raysGroup = useRef<THREE.Group>(null);
  const rayRefs = useRef<Array<THREE.Mesh | null>>([]);
  const counterRef = useRef<{ current: number }>({ current: 0 });
  const counterText = useRef<{ setText?: (s: string) => void } | null>(null);

  const workerPos = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
      }),
    []
  );

  useFrame(() => {
    if (!visible) return;
    const t = (performance.now() * 0.0001) % 1; // 10s loop
    const phase = t < 0.15 ? "dormant" : t < 0.3 ? "pulse" : t < 0.7 ? "rays" : "ticker";

    // Driver glow ramp
    if (driverMat.current) {
      let i = 0.3;
      if (phase === "pulse") i = 0.3 + ((t - 0.15) / 0.15) * 1.6;
      else if (phase === "rays" || phase === "ticker") i = 1.9 + Math.sin(performance.now() * 0.003) * 0.2;
      driverMat.current.emissiveIntensity = i;
    }

    // Pulse travels from code panel (down-left) to driver
    if (pulse.current) {
      if (phase === "pulse") {
        const pt = (t - 0.15) / 0.15;
        const start = new THREE.Vector3(-3.5, -1.8, 0);
        const end = new THREE.Vector3(0, 0, 0);
        pulse.current.visible = true;
        pulse.current.position.lerpVectors(start, end, pt);
        pulse.current.scale.setScalar(0.18 * (1 - pt) + 0.08);
      } else {
        pulse.current.visible = false;
      }
    }

    // Rays grow out from driver to each worker
    if (raysGroup.current) {
      if (phase === "rays" || phase === "ticker") {
        const rt = phase === "rays" ? (t - 0.3) / 0.4 : 1;
        for (let i = 0; i < 8; i++) {
          const mesh = rayRefs.current[i];
          if (!mesh) continue;
          mesh.visible = true;
          const w = workerPos[i];
          const len = w.length();
          mesh.scale.set(1, Math.min(1, rt + (i * 0.05)), 1);
          mesh.position.copy(w.clone().multiplyScalar(0.5));
          mesh.lookAt(w);
          mesh.rotateX(Math.PI / 2);
          mesh.scale.y = len * Math.min(1, rt + i * 0.04);
        }
      } else {
        rayRefs.current.forEach((m) => {
          if (m) m.visible = false;
        });
      }
    }

    // Counter ticks 0 → 8000 during ticker phase
    if (phase === "ticker") {
      const tt = (t - 0.7) / 0.3;
      const target = Math.floor(tt * 8000);
      if (target !== counterRef.current.current) {
        counterRef.current.current = target;
        counterText.current?.setText?.(`${target.toLocaleString()} / 8,000 tasks scheduled`);
      }
    } else if (phase === "dormant") {
      counterText.current?.setText?.(`0 / 8,000 tasks scheduled`);
    }
  });

  return (
    <group visible={visible}>
      {/* Code panel in lower-left */}
      <CodePanel position={[-3.5, -1.8, 0]} code={`# Spark wakes up\ndf.count()`} width={3.2} />

      {/* Pulse (small bright sphere traveling from code to driver) */}
      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.95} toneMapped={false} />
      </mesh>

      {/* Driver (center) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          ref={driverMat}
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.3}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={driverHalo}>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[0, 0, 0]} text="DRIVER" offset={1.05} size={0.18} color="#f4cf9c" />

      {/* 8 workers in a ring */}
      {workerPos.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial
              color={WORKER_TINTS[i % 4]}
              emissive={WORKER_TINTS[i % 4]}
              emissiveIntensity={0.5}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.4, 24, 24]} />
            <meshBasicMaterial color={WORKER_TINTS[i % 4]} transparent opacity={0.13} toneMapped={false} depthWrite={false} />
          </mesh>
        </group>
      ))}

      {/* Stage-0 rays from driver to each worker (cylinders) */}
      <group ref={raysGroup}>
        {workerPos.map((_, i) => (
          <mesh
            key={i}
            ref={(el) => {
              rayRefs.current[i] = el;
            }}
            visible={false}
          >
            <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
            <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.7} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* HUD info card: ticker */}
      <InfoCard
        position={[0, 0, 0]}
        offset={[0, 3.2, 0]}
        primary="STAGE 0"
        secondary="0 / 8,000 tasks scheduled"
        color="#f4cf9c"
      />

      {/* Bottom annotation */}
      <PlanetLabel
        position={[0, 0, 0]}
        text="LAZY → EAGER · the optimizer runs, the executors wake"
        offset={-3.0}
        size={0.13}
        color="#b0b0b8"
      />
    </group>
  );
}
