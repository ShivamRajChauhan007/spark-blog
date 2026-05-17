"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

/**
 * Per-scene camera waypoints. The rig interpolates linearly between the
 * waypoint for the active scene (at local=0) and the next (at local=1).
 * Index + local come from the same IntersectionObserver source the scenes
 * use — so camera, scene visibility, and prose are all synced.
 */
const WAYPOINTS: Array<{ pos: [number, number, number]; look: [number, number, number] }> = [
  // hero — wide orbit
  { pos: [0, 1.8, 7.5], look: [0, 0, 0] },
  // anatomy — three-quarter view of the highlighted worker, pulled back further
  { pos: [5.0, 1.5, 4.2], look: [3.2, 0, 0] },
  // driver — look at the master from slightly above
  { pos: [1.4, 0.9, 2.6], look: [0, 0, 0] },
  // data arrival — wide overhead so the incoming prism is framed throughout its travel
  { pos: [-2, 3.2, 7.0], look: [-3, 0, 0] },
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
  // ephemeral — slight angle so the materialising cluster reads as a stage
  { pos: [4.0, 2.8, 6.5], look: [0, 0, 0] },
  // fly — same as ephemeral; mode handoff for OrbitControls
  { pos: [0, 2, 7], look: [0, 0, 0] }
];

interface Props {
  index: number;
  local: number;
}

export function CameraRig({ index, local }: Props) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const a = WAYPOINTS[index] ?? WAYPOINTS[0];
    const b = WAYPOINTS[Math.min(WAYPOINTS.length - 1, index + 1)] ?? a;
    // smoothstep ease
    const t = local * local * (3 - 2 * local);

    // Mobile pullback: narrower viewport → pull camera back so geometry fits.
    const mobile = size.width > 0 && size.width < 640;
    const zScale = mobile ? 1.45 : 1;
    const yScale = mobile ? 1.15 : 1;

    const px = a.pos[0] + (b.pos[0] - a.pos[0]) * t;
    const py = (a.pos[1] + (b.pos[1] - a.pos[1]) * t) * yScale;
    const pz = (a.pos[2] + (b.pos[2] - a.pos[2]) * t) * zScale;

    camera.position.lerp(new THREE.Vector3(px, py, pz), 0.12);

    const lx = a.look[0] + (b.look[0] - a.look[0]) * t;
    const ly = a.look[1] + (b.look[1] - a.look[1]) * t;
    const lz = a.look[2] + (b.look[2] - a.look[2]) * t;
    target.current.lerp(new THREE.Vector3(lx, ly, lz), 0.12);
    camera.lookAt(target.current);
  });

  return null;
}
