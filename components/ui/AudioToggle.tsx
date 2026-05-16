"use client";

import { useAudio } from "@/components/audio/AudioProvider";

export function AudioToggle() {
  const { enabled, toggle } = useAudio();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Mute audio" : "Enable audio"}
      className="rounded-full border border-[var(--color-line)] bg-[var(--color-bg-elev)]/80 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)] backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {enabled ? "♪ on" : "♪ off"}
    </button>
  );
}
