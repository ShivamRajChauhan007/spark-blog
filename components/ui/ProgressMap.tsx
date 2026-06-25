"use client";

import { SCENES } from "@/lib/scenes";
import { useActiveSection } from "@/lib/useActiveSection";

/**
 * Vertical scroll mini-map on the right edge. Reads the IntersectionObserver-driven
 * active section so the kicker label always matches the prose currently in view,
 * even when the header consumes scrollable height.
 */
export function ProgressMap() {
  const index = useActiveSection();

  return (
    <nav
      aria-label="Scene navigator"
      className="pointer-events-none fixed right-3 inset-y-0 z-30 hidden flex-col items-end justify-between py-12 md:flex"
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
            className={`pointer-events-none whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition-all ${
              i === index
                ? "bg-[var(--color-bg-elev)]/85 text-[var(--color-accent)] opacity-100 backdrop-blur"
                : "text-[var(--color-fg-muted)]/45 opacity-100 group-hover:bg-[var(--color-bg-elev)]/85 group-hover:text-[var(--color-fg)] group-hover:backdrop-blur group-focus-visible:bg-[var(--color-bg-elev)]/85 group-focus-visible:text-[var(--color-fg)]"
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
