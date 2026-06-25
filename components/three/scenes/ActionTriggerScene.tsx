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

const WORKERS = 8;
const MOTES = 48; // 6 in-flight tasks per worker

/**
 * Scene 5 — `.count()` action trigger.
 *   0.0–1.5s  code panel fades in, driver dim
 *   1.5–3.0s  a pulse flies from df.count() into the driver; it lights up
 *   3.0–7.0s  driver opens 8 dispatch beams to the workers
 *   3.0–10s   task motes stream driver → workers (the assignment), workers flash
 *   7.0–10s   HUD ticks 0 → 8,000 tasks
 */
export function ActionTriggerScene({ progress: _progress, visible }: Props) {
  const driverMat = useRef<THREE.MeshStandardMaterial>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const rayRefs = useRef<Array<THREE.Mesh | null>>([]);
  const workerMats = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const motesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const counterRef = useRef<{ current: number }>({ current: 0 });
  const counterText = useRef<{ setText?: (s: string) => void } | null>(null);

  const workerPos = useMemo(
    () =>
      Array.from({ length: WORKERS }, (_, i) => {
        const a = (i / WORKERS) * Math.PI * 2 + Math.PI / 8;
        return new THREE.Vector3(Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
      }),
    []
  );

  const moteSeeds = useMemo(
    () =>
      Array.from({ length: MOTES }, (_, i) => ({
        worker: i % WORKERS,
        off: (i * 0.137) % 1,
        spd: 0.8 + ((i * 7) % 10) / 25
      })),
    []
  );

  useFrame(() => {
    if (!visible) return;
    const t = (performance.now() * 0.0001) % 1; // 10s loop
    const phase = t < 0.15 ? "dormant" : t < 0.3 ? "pulse" : t < 0.7 ? "rays" : "ticker";
    const dispatching = phase === "rays" || phase === "ticker";

    if (driverMat.current) {
      let i = 0.3;
      if (phase === "pulse") i = 0.3 + ((t - 0.15) / 0.15) * 1.6;
      else if (dispatching) i = 1.9 + Math.sin(performance.now() * 0.003) * 0.2;
      driverMat.current.emissiveIntensity = i;
    }

    // action pulse: df.count() → driver
    if (pulse.current) {
      if (phase === "pulse") {
        const pt = (t - 0.15) / 0.15;
        pulse.current.visible = true;
        pulse.current.position.lerpVectors(new THREE.Vector3(-3.5, -1.8, 0), new THREE.Vector3(0, 0, 0), pt);
        pulse.current.scale.setScalar(0.18 * (1 - pt) + 0.08);
      } else {
        pulse.current.visible = false;
      }
    }

    // dispatch beams grow toward each worker
    for (let i = 0; i < WORKERS; i++) {
      const mesh = rayRefs.current[i];
      if (!mesh) continue;
      if (dispatching) {
        mesh.visible = true;
        const w = workerPos[i];
        const len = w.length();
        const rt = phase === "rays" ? Math.min(1, (t - 0.3) / 0.4 + i * 0.04) : 1;
        mesh.position.copy(w.clone().multiplyScalar(0.5));
        mesh.lookAt(w);
        mesh.rotateX(Math.PI / 2);
        mesh.scale.set(1, len * rt, 1);
      } else {
        mesh.visible = false;
      }
    }

    // task motes stream driver → workers (the actual task assignment)
    if (motesRef.current) {
      const now = performance.now() * 0.0004;
      const perWorkerArrivals = new Array(WORKERS).fill(0);
      for (let i = 0; i < MOTES; i++) {
        const s = moteSeeds[i];
        if (!dispatching) {
          dummy.position.set(0, 0, 0);
          dummy.scale.setScalar(0.0001);
        } else {
          const p = (now * s.spd + s.off) % 1;
          const w = workerPos[s.worker];
          const x = w.x * p;
          const y = w.y * p + Math.sin(p * Math.PI) * 0.35; // gentle arc
          const z = w.z * p;
          dummy.position.set(x, y, z);
          dummy.scale.setScalar(0.07);
          if (p > 0.9) perWorkerArrivals[s.worker]++;
        }
        dummy.updateMatrix();
        motesRef.current.setMatrixAt(i, dummy.matrix);
      }
      motesRef.current.instanceMatrix.needsUpdate = true;
      // workers flash as tasks land
      for (let i = 0; i < WORKERS; i++) {
        const m = workerMats.current[i];
        if (m) m.emissiveIntensity = 0.5 + (dispatching ? perWorkerArrivals[i] * 0.5 : 0) + (dispatching ? Math.sin(performance.now() * 0.004 + i) * 0.1 : 0);
      }
    }

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
      <CodePanel position={[-3.5, -1.8, 0]} code={`# Spark wakes up\ndf.count()`} width={3.2} />

      <mesh ref={pulse} visible={false}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.95} toneMapped={false} />
      </mesh>

      {/* Driver */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial ref={driverMat} color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
      <PlanetLabel position={[0, 0, 0]} text="DRIVER" offset={1.05} size={0.18} color="#f4cf9c" />

      {/* Workers */}
      {workerPos.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial
              ref={(el) => {
                workerMats.current[i] = el;
              }}
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

      {/* Dispatch beams */}
      {workerPos.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rayRefs.current[i] = el;
          }}
          visible={false}
        >
          <cylinderGeometry args={[0.015, 0.015, 1, 8]} />
          <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.45} toneMapped={false} />
        </mesh>
      ))}

      {/* Task motes streaming out to workers */}
      <instancedMesh ref={motesRef} args={[undefined, undefined, MOTES]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#ffe6c0" toneMapped={false} />
      </instancedMesh>

      <InfoCard position={[0, 0, 0]} offset={[0, 2.5, 0]} primary="STAGE 0" secondary="0 / 8,000 tasks scheduled" color="#f4cf9c" />
    </group>
  );
}
