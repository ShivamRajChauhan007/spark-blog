"use client";

import { useEffect } from "react";
import { useActiveSection } from "@/lib/useActiveSection";
import { useAudio, type CueId } from "./AudioProvider";

/**
 * Watches scroll-driven scene transitions and fires a one-shot audio cue
 * every time the active scene index changes. Subscribes to integer index
 * so re-renders only happen on scene change.
 */
const CUE_BY_SCENE: Record<number, CueId> = {
  0: "chord", // hero
  1: "whoosh", // anatomy fly-in
  2: "power-on", // driver wakes
  3: "thunder", // data arrival
  4: "shatter", // partitions
  5: "tick", // task rain
  6: "whoosh", // narrow vs wide
  7: "chord", // shuffle (the big one)
  8: "tick", // stages
  9: "power-on", // airflow scheduler
  10: "chord", // ephemeral cycle
  11: "whoosh" // fly mode
};

export function SceneCueDriver() {
  const index = useActiveSection();
  const { playCue, setSceneAmbient } = useAudio();

  useEffect(() => {
    setSceneAmbient(index);
    const cue = CUE_BY_SCENE[index];
    if (cue) playCue(cue);
  }, [index, playCue, setSceneAmbient]);

  return null;
}
