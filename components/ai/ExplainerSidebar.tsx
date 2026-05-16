"use client";

import { useEffect, useState } from "react";
import { EXPLAINERS } from "./stubExplanations";
import { SceneId, SCENES } from "@/lib/scenes";
import { activeScene, useScrollProgress } from "@/lib/useScrollProgress";

/**
 * Floating right-rail explainer. Tracks current scene; "Explain this" reveals
 * a deeper explanation. Phase 7 swaps the stub for a streaming AI call.
 */
export function ExplainerSidebar() {
  const progress = useScrollProgress();
  const [open, setOpen] = useState(false);

  const { index } = activeScene(progress, SCENES.length);
  const scene = SCENES[index];
  const sceneId: SceneId = scene.id;
  const text = EXPLAINERS[sceneId];

  // collapse on scene change to encourage reading
  useEffect(() => {
    setOpen(false);
  }, [sceneId]);

  return (
    <aside
      aria-label="Inline explainer"
      className="pointer-events-none fixed bottom-6 right-6 z-30 hidden w-[min(28rem,calc(100vw-3rem))] flex-col items-end md:flex"
    >
      {open && (
        <div className="pointer-events-auto mb-3 max-h-[55vh] overflow-y-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elev)]/95 p-5 text-sm leading-relaxed text-[var(--color-fg)] shadow-2xl backdrop-blur-md">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
            on this scene · {scene.kicker}
          </p>
          <p className="font-serif text-base leading-[1.55]">{text}</p>
          <p className="mt-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)]">
            stubbed · live AI in phase 7
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="pointer-events-auto rounded-full border border-[var(--color-line)] bg-[var(--color-bg-elev)]/90 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)] backdrop-blur transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        {open ? "× close" : "✦ explain this"}
      </button>
    </aside>
  );
}
