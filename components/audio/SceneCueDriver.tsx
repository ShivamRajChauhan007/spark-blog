"use client";

import { useEffect, useRef } from "react";
import { activeScene, useScrollProgress } from "@/lib/useScrollProgress";
import { SCENES } from "@/lib/scenes";
import { useAudio, type CueId } from "./AudioProvider";

/**
 * Watches scroll-driven scene transitions and fires a one-shot audio cue
 * every time the active scene index changes. Lives invisibly inside the
 * article tree so it can read scroll position.
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
  const progress = useScrollProgress();
  const { playCue, setSceneAmbient } = useAudio();
  const lastIndex = useRef(-1);

  useEffect(() => {
    const { index } = activeScene(progress, SCENES.length);
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      setSceneAmbient(index);
      const cue = CUE_BY_SCENE[index];
      if (cue) playCue(cue);
    }
  }, [progress, playCue, setSceneAmbient]);

  return null;
}
