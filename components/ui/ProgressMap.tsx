"use client";

import { SCENES } from "@/lib/scenes";
import { activeScene, useScrollProgress } from "@/lib/useScrollProgress";

/**
 * A vertical scroll mini-map on the right edge. One dot per scene; the active
 * scene's dot fills. Bartosz-style. Click to jump.
 */
export function ProgressMap() {
  const progress = useScrollProgress();
  const { index } = activeScene(progress, SCENES.length);

  return (
    <nav
      aria-label="Scene navigator"
      className="pointer-events-none fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-end gap-2 md:flex"
    >
      {SCENES.map((s, i) => (
        <a
          key={s.id}
          href={`#scene-${s.id}`}
          aria-label={`Jump to scene ${s.index}: ${s.title}`}
          aria-current={i === index ? "true" : undefined}
          className="pointer-events-auto group flex items-center gap-2 outline-none"
        >
          <span
            className={`pointer-events-none rounded-full bg-[var(--color-bg-elev)]/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all ${
              i === index
                ? "max-w-[14rem] text-[var(--color-accent)] opacity-100"
                : "max-w-0 overflow-hidden opacity-0 group-hover:max-w-[14rem] group-hover:opacity-100 group-focus-visible:max-w-[14rem] group-focus-visible:opacity-100"
            }`}
          >
            {s.kicker}
          </span>
          <span
            className={`block h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-[var(--color-accent)]" : "w-1.5 bg-[var(--color-line)] group-hover:w-3 group-hover:bg-[var(--color-fg-muted)]"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
