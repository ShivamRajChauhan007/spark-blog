"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { SceneMeta } from "@/lib/scenes";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * The heavy WebGL renderer (three + @react-three/fiber + drei + every scene)
 * is code-split into its own chunk and only downloaded when a section nears the
 * viewport — keeping it out of the initial /spark payload so the prose loads
 * fast. The poster shows while the chunk downloads.
 */
const SceneRenderer = dynamic(() => import("./SceneRenderer").then((m) => m.SceneRenderer), {
  ssr: false,
  loading: () => <ScenePoster />
});

interface Props {
  scene: SceneMeta;
}

/**
 * Per-section 3D canvas. The WebGL chunk is lazy-loaded (dynamic import) and
 * the Canvas is mounted only when the section is within 600px of the viewport,
 * then torn down when it scrolls well away to release the GL context.
 */
export function SceneCanvas({ scene }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const reduced = useReducedMotion();
  const [smallScreen, setSmallScreen] = useState(false);

  // On phones (and for prefers-reduced-motion users) we serve a static SVG
  // poster instead of a live WebGL canvas: many GL contexts on a mobile GPU is
  // both heavy and prone to context loss. 768px matches the `md:` breakpoint
  // the article layout already switches on.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 767px)");
    setSmallScreen(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setSmallScreen(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const useStatic = reduced || smallScreen;

  useEffect(() => {
    if (useStatic || !wrapperRef.current) return;
    const el = wrapperRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            // Within 600px of the viewport: mount now so the 3D chunk downloads
            // and the scene renders *before* the reader scrolls to it.
            setMounted(true);
            setActive(e.intersectionRatio > 0.25);
          } else {
            // Scrolled well away (beyond the 600px rootMargin): tear the canvas
            // down so its WebGL context is released. Browsers cap live contexts
            // (~8–16, fewer on mobile Safari) and these scenes would otherwise
            // accumulate and start dropping contexts on a long scroll.
            setActive(false);
            setMounted(false);
          }
        }
      },
      { threshold: [0, 0.05, 0.25, 0.5, 1], rootMargin: "600px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [useStatic]);

  return (
    <div ref={wrapperRef} className="relative aspect-square w-full overflow-hidden md:aspect-[4/5]">
      {useStatic ? <ScenePoster /> : mounted ? <SceneRenderer sceneId={scene.id} active={active} /> : <ScenePoster />}

      {scene.caption && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[20rem]">
          <p className="font-serif text-[12.5px] leading-snug text-[var(--color-fg)]/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.95)]">
            {scene.caption}
          </p>
        </div>
      )}
      {!useStatic && (
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]/70">
          drag · scroll · right-click
        </div>
      )}
      {scene.legend && scene.legend.length > 0 && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-end">
          <div className="pointer-events-auto max-w-[90%] rounded-xl border border-[var(--color-line)]/70 bg-[var(--color-bg)]/85 px-3.5 py-2.5 shadow-lg backdrop-blur-md">
            <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--color-fg-muted)]/80">
              Legend
            </p>
            <ul className="space-y-1.5 text-[12px] leading-[1.35] text-[var(--color-fg)]/90">
              {scene.legend.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-[5px] inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-[var(--color-bg)]/60"
                    style={{ backgroundColor: item.swatch ?? "var(--color-accent)" }}
                  />
                  <span className="font-serif">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Static, dependency-free SVG stand-in for the live WebGL scene. Shown to
 * reduced-motion users, on small screens, and while the 3D chunk downloads —
 * so there's never an empty box. Evokes the cluster topology so it reads as
 * "the same thing, paused" rather than a blank.
 */
function ScenePoster() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <radialGradient id="poster-bg" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1c1e26" />
            <stop offset="100%" stopColor="#0b0c11" />
          </radialGradient>
        </defs>
        <rect width="1000" height="1000" fill="url(#poster-bg)" />
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i * 137) % 1000;
          const y = (i * 211) % 1000;
          const r = (i % 3) + 0.6;
          return <circle key={i} cx={x} cy={y} r={r} fill="#eaeaf0" opacity={0.3} />;
        })}
        <g transform="translate(500,500)">
          {(
            [
              [-220, -160],
              [220, -160],
              [-220, 160],
              [220, 160]
            ] as const
          ).map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <line x1="0" y1="0" x2={-x} y2={-y} stroke="#3c3d44" strokeWidth="0.8" strokeDasharray="3 5" />
              <rect x="-30" y="-30" width="60" height="60" rx="6" fill="none" stroke="#5fa8e5" strokeWidth="1.2" />
            </g>
          ))}
          <rect x="-40" y="-40" width="80" height="80" rx="6" fill="none" stroke="#e89856" strokeWidth="1.6" />
        </g>
      </svg>
    </div>
  );
}
