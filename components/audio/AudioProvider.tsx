"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Audio bus. Off by default per browser autoplay policy.
 * Ambient pad starts on enable; one-shot cues fire on scene transitions.
 */

interface AudioCtx {
  enabled: boolean;
  toggle: () => void;
  playCue: (cue: CueId) => void;
  setSceneAmbient: (sceneIndex: number) => void;
}

export type CueId = "power-on" | "shatter" | "whoosh" | "tick" | "chord" | "thunder";

const Ctx = createContext<AudioCtx | null>(null);

// Per-scene ambient pad pitch in scientific notation
const AMBIENT_NOTES = ["C2", "E2", "G2", "A2", "C3", "E3", "G3", "A3", "G2", "F2", "E2", "D2"];

export function AudioProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  // The cues bag holds heterogeneous Tone voices; we only use them via
  // duck-typed `triggerAttackRelease`, so we keep the type loose intentionally.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type CueVoice = any;
  const refs = useRef<{
    Tone: typeof import("tone");
    cues: Record<string, CueVoice>;
    pad?: CueVoice;
    padGain?: import("tone").Gain;
    sceneIndex: number;
  } | null>(null);

  const ensureTone = useCallback(async () => {
    if (refs.current) return refs.current;
    const Tone = await import("tone");
    await Tone.start();
    // master attenuation — keep audio in the background
    const masterGain = new Tone.Gain(0.45).toDestination();
    const padGain = new Tone.Gain(0.0).connect(masterGain); // start silent; ramp up

    const cues: Record<string, CueVoice> = {
      "power-on": new Tone.Synth({ oscillator: { type: "sine" }, envelope: { attack: 0.01, decay: 0.4, release: 0.6 } }).connect(masterGain),
      shatter: new Tone.NoiseSynth({ noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).connect(masterGain),
      whoosh: new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.05, decay: 0.55, sustain: 0 } }).connect(masterGain),
      tick: new Tone.Synth({ oscillator: { type: "triangle" }, envelope: { attack: 0.001, decay: 0.06, release: 0.05 } }).connect(masterGain),
      chord: new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" }, envelope: { attack: 0.06, decay: 0.6, release: 1.6 } }).connect(masterGain),
      thunder: new Tone.NoiseSynth({ noise: { type: "brown" }, envelope: { attack: 0.4, decay: 2.6, sustain: 0 } }).connect(masterGain)
    };

    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2.5, decay: 1.5, sustain: 0.7, release: 4 }
    }).connect(padGain);

    refs.current = { Tone, cues, pad, padGain, sceneIndex: 0 };

    // ramp pad up after a moment
    padGain.gain.rampTo(0.18, 2.5);
    pad.triggerAttack([AMBIENT_NOTES[0], "G2"]);

    return refs.current;
  }, []);

  const toggle = useCallback(async () => {
    if (!enabled) {
      await ensureTone();
      setEnabled(true);
    } else {
      // mute by ramping master to zero — keeps Tone state intact for fast re-enable
      const r = refs.current;
      if (r) {
        r.padGain?.gain.rampTo(0, 0.4);
      }
      setEnabled(false);
    }
  }, [enabled, ensureTone]);

  const playCue = useCallback(
    (cue: CueId) => {
      if (!enabled || !refs.current) return;
      const c = refs.current.cues[cue];
      if (!c) return;
      try {
        if (cue === "power-on") c.triggerAttackRelease("C4", "8n");
        else if (cue === "chord") c.triggerAttackRelease(["C4", "E4", "G4"], "2n");
        else if (cue === "tick") c.triggerAttackRelease("C6", "32n");
        else if (cue === "shatter") c.triggerAttackRelease("8n");
        else if (cue === "whoosh") c.triggerAttackRelease("4n");
        else if (cue === "thunder") c.triggerAttackRelease("2n");
      } catch {
        // tone context not started yet; ignore
      }
    },
    [enabled]
  );

  const setSceneAmbient = useCallback(
    (sceneIndex: number) => {
      const r = refs.current;
      if (!r || !r.pad || !enabled) return;
      if (r.sceneIndex === sceneIndex) return;
      r.sceneIndex = sceneIndex;
      const note = AMBIENT_NOTES[sceneIndex] ?? "C2";
      try {
        r.pad.releaseAll();
        r.pad.triggerAttack([note, "G2"]);
      } catch {
        // ignore
      }
    },
    [enabled]
  );

  // re-ramp on toggle back on
  useEffect(() => {
    const r = refs.current;
    if (!r) return;
    if (enabled) {
      r.padGain?.gain.rampTo(0.18, 1.5);
    }
  }, [enabled]);

  // cleanup
  useEffect(() => {
    return () => {
      const r = refs.current;
      if (!r) return;
      try {
        r.pad?.releaseAll();
        for (const k in r.cues) r.cues[k].dispose();
        r.pad?.dispose();
        r.padGain?.dispose();
      } catch {}
    };
  }, []);

  return <Ctx.Provider value={{ enabled, toggle, playCue, setSceneAmbient }}>{children}</Ctx.Provider>;
}

export function useAudio() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAudio must be used inside <AudioProvider>");
  return v;
}
