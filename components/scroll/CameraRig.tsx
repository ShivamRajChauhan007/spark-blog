"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { activeScene } from "@/lib/useScrollProgress";
import { SCENES } from "@/lib/scenes";

/**
 * Per-scene camera waypoints. The rig interpolates linearly between the
 * waypoint for scene N (at local=0) and scene N+1 (at local=1).
 * Values are tuned for the small cluster prop (master at origin, workers
 * on a circle of radius ~3).
 */
const WAYPOINTS: Array<{ pos: [number, number, number]; look: [number, number, number] }> = [
  // hero — wide orbit
  { pos: [0, 1.8, 7.5], look: [0, 0, 0] },
  // anatomy — fly toward a worker
  { pos: [2.8, 0.6, 2.4], look: [3.2, 0, 0] },
  // driver — fly to the master
  { pos: [0.4, 0.4, 1.6], look: [0, 0, 0] },
  // data arrival — pull back slightly, look at incoming prism
  { pos: [-3, 1.2, 5.0], look: [-1, 0, 0] },
  // partitions — overhead-ish
  { pos: [0, 6.5, 4.5], look: [0, 0, 0] },
  // task rain — wide again
  { pos: [4.5, 2.4, 5.5], look: [0, 0, 0] },
  // narrow vs wide — split view, side angle
  { pos: [-5.5, 1.5, 4.5], look: [0, 0, 0] },
  // shuffle — oblique angle so arcs read as horizontal motion, not falling
  { pos: [6.2, 4.4, 6.2], look: [0, 0.4, 0] },
  // stages — tilt slightly to read the floating DAG
  { pos: [0, 4.2, 7.5], look: [0, 1.5, 0] },
  // airflow — pull way out
  { pos: [0, 11, 14], look: [0, 2.5, 0] },
  // ephemeral — back close
  { pos: [0, 2, 7], look: [0, 0, 0] },
  // fly — same as ephemeral; mode handoff for OrbitControls
  { pos: [0, 2, 7], look: [0, 0, 0] }
];

interface Props {
  progress: number; // 0..1 across whole document
}

export function CameraRig({ progress }: Props) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const { index, local } = activeScene(progress, SCENES.length);
    const a = WAYPOINTS[index];
    const b = WAYPOINTS[Math.min(WAYPOINTS.length - 1, index + 1)];
    // smoothstep ease
    const t = local * local * (3 - 2 * local);

    const px = a.pos[0] + (b.pos[0] - a.pos[0]) * t;
    const py = a.pos[1] + (b.pos[1] - a.pos[1]) * t;
    const pz = a.pos[2] + (b.pos[2] - a.pos[2]) * t;

    camera.position.lerp(new THREE.Vector3(px, py, pz), 0.12);

    const lx = a.look[0] + (b.look[0] - a.look[0]) * t;
    const ly = a.look[1] + (b.look[1] - a.look[1]) * t;
    const lz = a.look[2] + (b.look[2] - a.look[2]) * t;
    target.current.lerp(new THREE.Vector3(lx, ly, lz), 0.12);
    camera.lookAt(target.current);
  });

  return null;
}
