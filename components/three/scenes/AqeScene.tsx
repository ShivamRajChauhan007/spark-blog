"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

/**
 * Scene 10 — Adaptive Query Execution (AQE) / skew handling.
 * Animation: one of four workers receives a SKEWED (3× larger) partition.
 * After ~2 seconds AQE "detects" it (the partition pulses red), then SPLITS
 * into smaller pieces that migrate to free executors. All workers finish
 * around the same time afterwards.
 *
 * Loop length: 5 seconds.
 *   0.0 - 1.5s  Normal partitions arrive; one is 3× big at W1
 *   1.5 - 2.0s  AQE detection pulse (red ring)
 *   2.0 - 3.5s  Split: the big sphere divides and 2 pieces migrate to W2, W3
 *   3.5 - 5.0s  All workers complete with a bright sync flash
 */
export function AqeScene({ progress: _progress, visible }: Props) {
  const sphereRefs = useRef<Array<THREE.Mesh | null>>([]);
  const detectionRing = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const workerMatRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([]);

  const workerPos = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
      }),
    []
  );

  useFrame(() => {
    if (!visible) return;
    const t = (performance.now() * 0.0002) % 1; // 5s loop

    // Phase definitions
    const phase = t < 0.3 ? "arrive" : t < 0.4 ? "detect" : t < 0.7 ? "split" : "finish";

    // Worker flashes during finish
    workerMatRefs.current.forEach((m, i) => {
      if (!m) return;
      if (phase === "finish") {
        const ft = (t - 0.7) / 0.3;
        m.emissiveIntensity = 0.55 + (1 - ft) * 1.4;
      } else {
        m.emissiveIntensity = 0.55;
      }
    });

    // The skewed sphere at W1 (and its splits)
    const w1 = workerPos[0];
    const w2 = workerPos[1];
    const w3 = workerPos[2];

    // Main skewed partition (index 0)
    const main = sphereRefs.current[0];
    if (main) {
      if (phase === "arrive" || phase === "detect") {
        const arrive = Math.min(1, t / 0.25);
        const start = new THREE.Vector3(0, 1.5, 0);
        main.position.lerpVectors(start, w1.clone().add(new THREE.Vector3(0, 0.25, 0)), arrive);
        main.scale.setScalar(0.45);
        (main.material as THREE.MeshBasicMaterial).color.copy(
          phase === "detect" ? PALETTE.danger : PALETTE.accent
        );
      } else if (phase === "split") {
        // shrink + migrate two split halves
        main.scale.setScalar(0.25);
        main.position.copy(w1).add(new THREE.Vector3(0, 0.25, 0));
      } else {
        main.scale.setScalar(0.18);
        main.position.copy(w1).add(new THREE.Vector3(0, 0.25, 0));
      }
    }

    // Split children (indices 1 and 2)
    const splitA = sphereRefs.current[1];
    const splitB = sphereRefs.current[2];
    if (splitA && splitB) {
      if (phase === "split") {
        const st = (t - 0.4) / 0.3;
        splitA.visible = true;
        splitB.visible = true;
        splitA.position.lerpVectors(w1, w2.clone().add(new THREE.Vector3(0, 0.2, 0)), st);
        splitB.position.lerpVectors(w1, w3.clone().add(new THREE.Vector3(0, 0.2, 0)), st);
        splitA.scale.setScalar(0.22);
        splitB.scale.setScalar(0.22);
      } else if (phase === "finish") {
        splitA.visible = true;
        splitB.visible = true;
        splitA.position.copy(w2).add(new THREE.Vector3(0, 0.2, 0));
        splitB.position.copy(w3).add(new THREE.Vector3(0, 0.2, 0));
        splitA.scale.setScalar(0.18);
        splitB.scale.setScalar(0.18);
      } else {
        splitA.visible = false;
        splitB.visible = false;
      }
    }

    // Detection ring around W1
    if (detectionRing.current && ringMat.current) {
      if (phase === "detect") {
        detectionRing.current.position.copy(w1);
        detectionRing.current.visible = true;
        const dt = (t - 0.3) / 0.1;
        detectionRing.current.scale.setScalar(1 + dt * 2);
        ringMat.current.opacity = 0.9 * (1 - dt);
      } else {
        detectionRing.current.visible = false;
      }
    }
  });

  return (
    <group visible={visible}>
      <PlanetLabel position={[0, 0, 0]} text="AQE · SKEW SPLIT" offset={4.0} size={0.2} color="#f4cf9c" />
      <PlanetLabel
        position={[0, 0, 0]}
        text="factor > 5× median ∧ size > 256 MB → split"
        offset={3.55}
        size={0.12}
        color="#b0b0b8"
      />

      {/* central master */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.75} toneMapped={false} />
      </mesh>

      {/* workers */}
      {workerPos.map((p, i) => (
        <group key={i}>
          <mesh position={p}>
            <sphereGeometry args={[0.45, 28, 28]} />
            <meshStandardMaterial
              ref={(el) => {
                workerMatRefs.current[i] = el;
              }}
              color={WORKER_TINTS[i]}
              emissive={WORKER_TINTS[i]}
              emissiveIntensity={0.55}
              toneMapped={false}
            />
          </mesh>
          <PlanetLabel position={[p.x, p.y, p.z]} text={`W${i + 1}`} offset={0.72} size={0.14} color="#c8dfff" />
        </group>
      ))}

      {/* skewed partition + its splits */}
      <mesh
        ref={(el) => {
          sphereRefs.current[0] = el;
        }}
      >
        <sphereGeometry args={[1, 18, 18]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh
        ref={(el) => {
          sphereRefs.current[1] = el;
        }}
        visible={false}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={PALETTE.accent2} transparent opacity={0.95} toneMapped={false} />
      </mesh>
      <mesh
        ref={(el) => {
          sphereRefs.current[2] = el;
        }}
        visible={false}
      >
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={PALETTE.accent2} transparent opacity={0.95} toneMapped={false} />
      </mesh>

      {/* detection ring (only during detect phase) */}
      <mesh ref={detectionRing} rotation={[Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.6, 0.7, 48]} />
        <meshBasicMaterial
          ref={ringMat}
          color={PALETTE.danger}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
