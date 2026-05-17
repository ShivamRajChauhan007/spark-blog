"use client";

/**
 * Reduced-motion + loading fallback. Renders into the same fixed-bleed slot
 * the real Canvas would occupy, but as a static SVG.
 */
export function StubCanvas() {
  return (
    <div className="scene-canvas" aria-hidden>
      <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <defs>
          <radialGradient id="g" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1c1e26" stopOpacity="1" />
            <stop offset="100%" stopColor="#0c0d12" stopOpacity="1" />
          </radialGradient>
        </defs>
        <rect width="1000" height="1000" fill="url(#g)" />
        {Array.from({ length: 80 }).map((_, i) => {
          const x = (i * 137) % 1000;
          const y = (i * 211) % 1000;
          const r = (i % 3) + 0.6;
          return <circle key={i} cx={x} cy={y} r={r} fill="#eaeaf0" opacity={0.32} />;
        })}
        <g transform="translate(500,500)">
          <rect x="-40" y="-40" width="80" height="80" rx="6" fill="none" stroke="#e89856" strokeWidth="1.4" />
          {[
            [-220, -160],
            [220, -160],
            [-220, 160],
            [220, 160]
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect x="-30" y="-30" width="60" height="60" rx="6" fill="none" stroke="#5fa8e5" strokeWidth="1.1" />
              <line
                x1="0"
                y1="0"
                x2={-x}
                y2={-y}
                stroke="#3c3d44"
                strokeWidth="0.7"
                strokeDasharray="3 4"
              />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
