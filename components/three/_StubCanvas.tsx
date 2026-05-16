"use client";

/**
 * Phase 1 placeholder. A subtle radial gradient + faint constellation
 * so the article reads cleanly before the real 3D lands in Phase 2.
 */
export function StubCanvas() {
  return (
    <div className="scene-canvas pointer-events-none -z-10" aria-hidden>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <radialGradient id="g" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="oklch(0.22 0.04 252)" stopOpacity="1" />
            <stop offset="100%" stopColor="oklch(0.14 0.013 252)" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="1000" height="1000" fill="url(#g)" />
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i * 137) % 1000;
          const y = (i * 211) % 1000;
          const r = (i % 3) + 0.6;
          return <circle key={i} cx={x} cy={y} r={r} fill="oklch(0.95 0.005 252)" opacity={0.35} />;
        })}
        <g transform="translate(500,500)">
          <rect x="-40" y="-40" width="80" height="80" rx="6" fill="none" stroke="oklch(0.78 0.16 65)" strokeWidth="1.2" />
          {[
            [-220, -160],
            [220, -160],
            [-220, 160],
            [220, 160]
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect x="-30" y="-30" width="60" height="60" rx="6" fill="none" stroke="oklch(0.74 0.14 220)" strokeWidth="1" />
              <line x1="0" y1="0" x2={-x} y2={-y} stroke="oklch(0.45 0.05 252)" strokeWidth="0.5" strokeDasharray="3 4" />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
