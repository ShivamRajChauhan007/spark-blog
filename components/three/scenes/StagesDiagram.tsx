"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { PALETTE } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

const STAGE_X = [-2.8, 0, 2.8];
const TASKS_PER_STAGE = 9;
const CROSS = 10; // shuffle dots crossing each boundary

/**
 * Scene 12 — Stages. Three stages laid out left→right. Tasks pipeline DOWN
 * each stage's column (narrow ops, no data movement); between stages sits a
 * red shuffle-boundary plane that rows must cross (the shuffle). Reads as
 * "work proceeds stage by stage, and every gap between stages is a shuffle."
 */
export function StagesDiagram({ progress: _progress, visible }: Props) {
  const taskRefs = useRef<Array<THREE.Mesh | null>>([]);
  const crossRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const tasks = useMemo(() => {
    const arr: Array<{ stage: number; phase: number; xj: number; zj: number }> = [];
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < TASKS_PER_STAGE; i++) {
        arr.push({
          stage: s,
          phase: i / TASKS_PER_STAGE,
          xj: (((i * 37) % 10) / 10) * 0.5 - 0.25,
          zj: (((i * 53) % 10) / 10) * 0.8 - 0.4
        });
      }
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!visible) return;
    const t = performance.now() * 0.0002;
    tasks.forEach((tk, idx) => {
      const m = taskRefs.current[idx];
      if (!m) return;
      const p = (t + tk.phase) % 1; // pipeline downward within the stage
      m.position.set(STAGE_X[tk.stage] + tk.xj, 1.2 - p * 2.4, tk.zj);
      m.scale.setScalar(0.12 * (0.6 + 0.4 * Math.sin(p * Math.PI)));
    });
    if (crossRef.current) {
      for (let i = 0; i < CROSS * 2; i++) {
        const boundary = i < CROSS ? 0 : 1; // stage0→1, stage1→2
        const k = i % CROSS;
        const p = (t * 1.3 + k / CROSS) % 1;
        const x0 = STAGE_X[boundary];
        const x1 = STAGE_X[boundary + 1];
        const y = Math.sin(p * Math.PI) * 0.5 + (((k * 17) % 10) / 10 - 0.5) * 0.8;
        dummy.position.set(x0 + (x1 - x0) * p, y, (((k * 29) % 10) / 10) * 1.2 - 0.6);
        dummy.scale.setScalar(0.09);
        dummy.updateMatrix();
        crossRef.current.setMatrixAt(i, dummy.matrix);
      }
      crossRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const stageColor = (s: number) => (s === 1 ? PALETTE.accent : PALETTE.accent2);

  return (
    <group visible={visible}>
      {/* shuffle boundary planes */}
      {[-1.4, 1.4].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <planeGeometry args={[0.06, 3]} />
          <meshBasicMaterial color={PALETTE.danger} transparent opacity={0.28} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      <PlanetLabel position={[-1.4, 1.75, 0]} text="shuffle" offset={0} size={0.12} color="#e96440" />
      <PlanetLabel position={[1.4, 1.75, 0]} text="shuffle" offset={0} size={0.12} color="#e96440" />

      {/* pipelining tasks */}
      {tasks.map((tk, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            taskRefs.current[idx] = el;
          }}
        >
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color={stageColor(tk.stage)} emissive={stageColor(tk.stage)} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      ))}

      {/* shuffle dots crossing the boundaries */}
      <instancedMesh ref={crossRef} args={[undefined, undefined, CROSS * 2]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={PALETTE.fg} transparent opacity={0.85} toneMapped={false} />
      </instancedMesh>

      {/* stage labels */}
      {STAGE_X.map((x, s) => (
        <PlanetLabel key={s} position={[x, -1.6, 0]} text={`STAGE ${s + 1}`} offset={0} size={0.16} color={s === 1 ? "#f4cf9c" : "#9fcef7"} />
      ))}
    </group>
  );
}
