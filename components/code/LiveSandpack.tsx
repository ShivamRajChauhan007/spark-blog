"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

/**
 * Embedded live code playground at scene 8.
 * Theme uses sRGB hex (was OKLCH; Sandpack's CSS-in-JS does support oklch
 * but we standardise on hex to match the Three.js palette and avoid mixed
 * formats across the codebase).
 */
export function LiveSandpack() {
  return (
    <div className="my-8 max-w-md overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elev)]/85 shadow-2xl backdrop-blur">
      <div className="border-b border-[var(--color-line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
        live · pyspark-flavoured · edit and run
      </div>
      <Sandpack
        theme={{
          colors: {
            surface1: "#13141a",
            surface2: "#181a21",
            surface3: "#1d1f28",
            clickable: "#b0b0b8",
            base: "#f4f4f5",
            disabled: "#6a6b73",
            hover: "#f4f4f5",
            accent: "#e89856",
            error: "#e96440",
            errorSurface: "#3a1d12"
          },
          syntax: {
            plain: "#eaeaf0",
            comment: { color: "#83848c", fontStyle: "italic" },
            keyword: "#e89856",
            tag: "#5fa8e5",
            punctuation: "#b0b0b8",
            definition: "#f4f4f5",
            property: "#62cf83",
            static: "#f4f4f5",
            string: "#e89856"
          },
          font: {
            body: "var(--font-body)",
            mono: "var(--font-mono)",
            size: "13px",
            lineHeight: "1.6"
          }
        }}
        template="vanilla-ts"
        options={{
          showLineNumbers: true,
          showTabs: false,
          editorHeight: 200,
          showConsole: false,
          showConsoleButton: false
        }}
        files={{
          "/index.ts": `// Pretend this is PySpark. Change the key, watch the shuffle re-shape.
type Row = { country: string; city: string; amount: number };

const rows: Row[] = [
  { country: "US", city: "NYC", amount: 12 },
  { country: "US", city: "LA",  amount: 3  },
  { country: "MX", city: "MEX", amount: 7  },
  { country: "CA", city: "YYZ", amount: 5  },
  { country: "MX", city: "GDL", amount: 9  },
  { country: "US", city: "SEA", amount: 1  },
  { country: "CA", city: "YUL", amount: 4  }
];

const KEY: keyof Row = "country"; // try "city" or "country"

const grouped = rows.reduce<Record<string, number>>((acc, r) => {
  const k = String(r[KEY]);
  acc[k] = (acc[k] ?? 0) + r.amount;
  return acc;
}, {});

document.body.style.background = "#08090e";
document.body.style.color = "#eaeaf0";
document.body.style.fontFamily = "ui-monospace,Geist Mono,monospace";
document.body.style.padding = "1.5rem";
document.body.innerHTML = "<pre>" + JSON.stringify(grouped, null, 2) + "</pre>";
`
        }}
      />
    </div>
  );
}
