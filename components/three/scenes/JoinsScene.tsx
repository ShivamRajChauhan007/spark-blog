"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { PALETTE, WORKER_TINTS } from "@/lib/colors";
import { PlanetLabel } from "./_shared";

interface Props {
  progress: number;
  visible: boolean;
}

/**
 * Scene 8 — Joins.
 * Cycles between three join strategies on a 6-second loop:
 *   0.00 - 2.00s  Broadcast Hash Join — small table replicates to every worker
 *   2.00 - 4.00s  Sort-Merge Join — both sides shuffle to same partitions, sort, merge
 *   4.00 - 6.00s  Shuffle Hash Join — like SMJ without the sort step
 * Labels at top of canvas update with the active strategy.
 */
const STRATEGY_LABELS = [
  "BROADCAST HASH JOIN · small × big",
  "SORT-MERGE JOIN · big × big",
  "SHUFFLE HASH JOIN · medium × big"
];

export function JoinsScene({ progress: _progress, visible }: Props) {
  const broadcastGroup = useRef<THREE.Group>(null);
  const smjGroup = useRef<THREE.Group>(null);
  const shjGroup = useRef<THREE.Group>(null);
  const [activeIdx, setActiveIdx] = useState(0);

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
    const now = performance.now() * 0.001;
    const phase = Math.floor((now / 2) % 3); // 0, 1, 2
    if (phase !== activeIdx) setActiveIdx(phase);
    const localT = (now / 2) % 1; // 0..1 within the active strategy window

    // Broadcast: small table copies fly OUT from a "small" planet to all workers
    if (broadcastGroup.current) {
      broadcastGroup.current.visible = phase === 0;
      const children = broadcastGroup.current.children;
      // skip the first child (anchor small planet) — copies start at index 1
      for (let i = 1; i < children.length; i++) {
        const dest = workerPos[(i - 1) % 4];
        const start = new THREE.Vector3(-4, 0, 0); // small table sits left of cluster
        children[i].position.lerpVectors(start, dest, Math.min(1, localT * 1.5));
        const scale = 0.18 + Math.sin(localT * Math.PI) * 0.04;
        children[i].scale.setScalar(scale);
      }
    }

    // SMJ: rows shuffle BETWEEN workers (both ways), then "sort" into lines
    if (smjGroup.current) {
      smjGroup.current.visible = phase === 1;
      smjGroup.current.rotation.y += 0.002;
    }

    // SHJ: rows arrive at the workers (shuffle), one side hashes (light up)
    if (shjGroup.current) {
      shjGroup.current.visible = phase === 2;
    }
  });

  return (
    <group visible={visible}>
      {/* Title (changes per strategy) */}
      <PlanetLabel
        position={[0, 0, 0]}
        text={STRATEGY_LABELS[activeIdx]}
        offset={4.0}
        size={0.18}
        color="#f4cf9c"
      />

      {/* 4 worker planets (common to all strategies) */}
      {workerPos.map((p, i) => (
        <group key={i}>
          <mesh position={p}>
            <sphereGeometry args={[0.45, 28, 28]} />
            <meshStandardMaterial
              color={WORKER_TINTS[i]}
              emissive={WORKER_TINTS[i]}
              emissiveIntensity={activeIdx === 2 && i < 2 ? 1.0 : 0.55}
              toneMapped={false}
            />
          </mesh>
          <PlanetLabel position={[p.x, p.y, p.z]} text={`W${i + 1}`} offset={0.72} size={0.14} color="#c8dfff" />
        </group>
      ))}

      {/* Broadcast group */}
      <group ref={broadcastGroup}>
        {/* small table anchor on the left */}
        <mesh position={[-4, 0, 0]}>
          <sphereGeometry args={[0.32, 28, 28]} />
          <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
        <PlanetLabel position={[-4, 0, 0]} text="countries · 100 KB" offset={0.62} size={0.13} color="#9be8b3" />
        {/* 4 copies that fly to each worker */}
        {workerPos.map((_, i) => (
          <mesh key={i} position={[-4, 0, 0]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial color={PALETTE.success} emissive={PALETTE.success} emissiveIntensity={0.9} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Sort-Merge group */}
      <group ref={smjGroup}>
        <PlanetLabel position={[0, -3.4, 0]} text="HASH KEY → PARTITION → SORT → MERGE" offset={0} size={0.12} color="#9fcef7" />
        {/* arrows BETWEEN workers (both ways) */}
        {workerPos.map((from, i) => {
          const to = workerPos[(i + 1) % 4];
          const mid = from.clone().lerp(to, 0.5);
          mid.y += 1.0;
          return (
            <SmjArc key={i} from={from} mid={mid} to={to} color={PALETTE.accent2} />
          );
        })}
      </group>

      {/* Shuffle Hash group */}
      <group ref={shjGroup}>
        <PlanetLabel position={[0, -3.4, 0]} text="HASH BUILD SIDE · STREAM PROBE SIDE" offset={0} size={0.12} color="#9fcef7" />
        {/* central "hash table" indicator */}
        <mesh position={[0, 1.6, 0]}>
          <torusGeometry args={[0.6, 0.05, 8, 32]} />
          <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>

    </group>
  );
}

/** Animated arc between two workers (sort-merge shuffle visualization). */
function SmjArc({
  from,
  mid,
  to,
  color
}: {
  from: THREE.Vector3;
  mid: THREE.Vector3;
  to: THREE.Vector3;
  color: THREE.Color;
}) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const [curve] = useState(() => new THREE.CatmullRomCurve3([from, mid, to]));

  useFrame(() => {
    if (!sphereRef.current) return;
    const t = ((performance.now() * 0.0006) % 1);
    const p = curve.getPointAt(t);
    sphereRef.current.position.copy(p);
  });

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[0.08, 12, 12]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
    </mesh>
  );
}
