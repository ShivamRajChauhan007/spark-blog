"use client";

import { useEffect, useState } from "react";

/**
 * Subtle "scroll to begin" hint that fades out after the reader moves.
 */
export function HeroHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 80) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed bottom-8 left-1/2 z-20 -translate-x-1/2 transition-opacity duration-700 ${
        visible ? "opacity-80" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-fg-muted)]">
        <span>scroll to begin</span>
        <span className="block h-8 w-px animate-pulse bg-[var(--color-fg-muted)]" />
      </div>
    </div>
  );
}
