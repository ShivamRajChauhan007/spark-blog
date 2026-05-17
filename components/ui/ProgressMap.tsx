"use client";

import { SCENES } from "@/lib/scenes";
import { useActiveSceneIndex } from "@/lib/useScrollProgress";

/**
 * Vertical scroll mini-map on the right edge. One dot per scene; the active
 * scene's dot fills. Subscribes to the integer scene index — only re-renders
 * on scene change, not every frame.
 */
export function ProgressMap() {
  const index = useActiveSceneIndex(SCENES.length);

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
            className={`pointer-events-none rounded-full bg-[var(--color-bg-elev)]/85 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all ${
              i === index
                ? "max-w-[14rem] text-[var(--color-accent)] opacity-100"
                : "max-w-0 overflow-hidden opacity-0 group-hover:max-w-[14rem] group-hover:opacity-100 group-focus-visible:max-w-[14rem] group-focus-visible:opacity-100"
            }`}
          >
            {s.kicker}
          </span>
          <span
            className={`block rounded-full transition-all ${
              i === index
                ? "h-2 w-7 bg-[var(--color-accent)] shadow-[0_0_10px_rgba(232,152,86,0.5)]"
                : "h-2 w-2 bg-[var(--color-fg-muted)]/55 group-hover:w-4 group-hover:bg-[var(--color-fg)]"
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
