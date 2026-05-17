"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { readActiveSection, readActiveSectionLocal } from "@/lib/useActiveSection";

/**
 * Per-scene camera waypoints. The rig reads both the active section index AND
 * the local progress within that section directly inside useFrame — bypassing
 * React entirely so SceneStage never re-renders per frame (which was crashing
 * R3F's WebGL context creation in dev with "Cannot read properties of null
 * (reading 'alpha')").
 */
const WAYPOINTS: Array<{ pos: [number, number, number]; look: [number, number, number] }> = [
  { pos: [0, 1.8, 7.5], look: [0, 0, 0] },
  { pos: [5.0, 1.5, 4.2], look: [3.2, 0, 0] },
  { pos: [1.4, 0.9, 2.6], look: [0, 0, 0] },
  { pos: [-2, 3.2, 7.0], look: [-3, 0, 0] },
  { pos: [0, 6.5, 4.5], look: [0, 0, 0] },
  { pos: [4.5, 2.4, 5.5], look: [0, 0, 0] },
  { pos: [-5.5, 1.5, 4.5], look: [0, 0, 0] },
  { pos: [6.2, 4.4, 6.2], look: [0, 0.4, 0] },
  { pos: [0, 4.2, 7.5], look: [0, 1.5, 0] },
  { pos: [0, 11, 14], look: [0, 2.5, 0] },
  { pos: [4.0, 2.8, 6.5], look: [0, 0, 0] },
  { pos: [0, 2, 7], look: [0, 0, 0] }
];

export function CameraRig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3());

  useFrame(() => {
    const index = readActiveSection();
    const local = readActiveSectionLocal();
    const a = WAYPOINTS[index] ?? WAYPOINTS[0];
    const b = WAYPOINTS[Math.min(WAYPOINTS.length - 1, index + 1)] ?? a;
    const t = local * local * (3 - 2 * local);

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
