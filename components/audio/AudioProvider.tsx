"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Lightweight audio bus. Sound is OFF by default per browser autoplay policies.
 * Phase 5 swaps the stub patches for real Tone.js synth voices.
 */

interface AudioCtx {
  enabled: boolean;
  toggle: () => void;
  playCue: (cue: CueId) => void;
  setSceneAmbient: (sceneIndex: number) => void;
}

export type CueId = "power-on" | "shatter" | "whoosh" | "tick" | "chord" | "thunder";

const Ctx = createContext<AudioCtx | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const toneRef = useRef<{
    Tone: typeof import("tone");
    ambient?: import("tone").Synth;
    cues?: Record<string, import("tone").Synth | import("tone").NoiseSynth>;
    sceneIndex: number;
  } | null>(null);

  // lazy-load Tone.js only when user enables audio (saves ~80KB on first paint)
  const ensureTone = useCallback(async () => {
    if (toneRef.current) return toneRef.current;
    const Tone = await import("tone");
    await Tone.start();
    const cues = {
      "power-on": new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.4, release: 0.6 } }).toDestination(),
      shatter: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).toDestination(),
      whoosh: new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.05, decay: 0.5, sustain: 0 } }).toDestination(),
      tick: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.06, release: 0.05 } }).toDestination(),
      chord: new Tone.Synth({ oscillator: { type: "sawtooth" }, envelope: { attack: 0.05, decay: 0.6, release: 1.4 } }).toDestination(),
      thunder: new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.4, decay: 2.6, sustain: 0 } }).toDestination()
    } as Record<string, import("tone").Synth | import("tone").NoiseSynth>;
    toneRef.current = { Tone, cues, sceneIndex: 0 };
    return toneRef.current;
  }, []);

  const toggle = useCallback(async () => {
    if (!enabled) {
      await ensureTone();
      setEnabled(true);
    } else {
      setEnabled(false);
    }
  }, [enabled, ensureTone]);

  const playCue = useCallback(
    (cue: CueId) => {
      if (!enabled || !toneRef.current) return;
      const c = toneRef.current.cues?.[cue];
      if (!c) return;
      try {
        if ("triggerAttackRelease" in c) {
          if (cue === "power-on") (c as import("tone").Synth).triggerAttackRelease("C4", "8n");
          else if (cue === "chord") (c as import("tone").Synth).triggerAttackRelease("G3", "2n");
          else if (cue === "tick") (c as import("tone").Synth).triggerAttackRelease("C6", "32n");
          else (c as import("tone").NoiseSynth).triggerAttackRelease("4n");
        }
      } catch {
        // tone may complain if context not started; ignore
      }
    },
    [enabled]
  );

  const setSceneAmbient = useCallback(
    (sceneIndex: number) => {
      if (!toneRef.current) return;
      toneRef.current.sceneIndex = sceneIndex;
      // Phase 5: vary ambient pad pitch per scene
    },
    []
  );

  // cleanup
  useEffect(() => {
    return () => {
      if (toneRef.current) {
        for (const k in toneRef.current.cues) {
          try {
            toneRef.current.cues[k].dispose();
          } catch {}
        }
      }
    };
  }, []);

  return <Ctx.Provider value={{ enabled, toggle, playCue, setSceneAmbient }}>{children}</Ctx.Provider>;
}

export function useAudio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used inside <AudioProvider>");
  return v;
}
