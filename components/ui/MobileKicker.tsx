"use client";

import { SCENES } from "@/lib/scenes";
import { useActiveSection } from "@/lib/useActiveSection";

/**
 * Tiny scene-kicker visible only on mobile (where ProgressMap is hidden).
 * Reads the IntersectionObserver-driven active section so it stays synced
 * with the prose card under the reader's eye.
 */
export function MobileKicker() {
  const index = useActiveSection();
  const scene = SCENES[index] ?? SCENES[0];
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed left-4 top-4 z-30 md:hidden"
    >
      <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-bg-elev)]/85 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)] backdrop-blur">
        {scene.kicker}
      </span>
    </div>
  );
}
