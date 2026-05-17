"use client";

import { Sandpack } from "@codesandbox/sandpack-react";

/**
 * Phase 6 — embedded live code playground.
 * Hosted next to the shuffle scene so readers can edit the groupBy key
 * and watch the visualisation react. The visual coupling lands in phase 6+,
 * the editor itself ships now so the layout is finalised.
 */
export function LiveSandpack() {
  return (
    <div className="my-12 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elev)]/60 backdrop-blur">
      <div className="border-b border-[var(--color-line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
        live · pyspark-flavoured · edit and run
      </div>
      <Sandpack
        theme={{
          colors: {
            surface1: "oklch(0.15 0.013 252)",
            surface2: "oklch(0.18 0.014 252)",
            surface3: "oklch(0.20 0.014 252)",
            clickable: "oklch(0.72 0.012 252)",
            base: "oklch(0.96 0.005 252)",
            disabled: "oklch(0.4 0.012 252)",
            hover: "oklch(0.96 0.005 252)",
            accent: "oklch(0.78 0.16 65)",
            error: "oklch(0.68 0.20 25)",
            errorSurface: "oklch(0.2 0.06 25)"
          },
          syntax: {
            plain: "oklch(0.92 0.005 252)",
            comment: { color: "oklch(0.55 0.012 252)", fontStyle: "italic" },
            keyword: "oklch(0.78 0.16 65)",
            tag: "oklch(0.74 0.14 220)",
            punctuation: "oklch(0.72 0.012 252)",
            definition: "oklch(0.96 0.005 252)",
            property: "oklch(0.78 0.16 145)",
            static: "oklch(0.96 0.005 252)",
            string: "oklch(0.78 0.16 65)"
          },
          font: {
            body: "var(--font-body)",
            mono: "var(--font-mono)",
            size: "13px",
            lineHeight: "1.6"
          }
        }}
        template="vanilla-ts"
        options={{ showLineNumbers: true, showTabs: false, editorHeight: 240 }}
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
