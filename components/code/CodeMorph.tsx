"use client";

import { useEffect, useState } from "react";
import { ShikiMagicMove } from "shiki-magic-move/react";
import "shiki-magic-move/dist/style.css";

/**
 * Phase 6 — code morph card.
 * Cycles between three forms of "submit the job": spark-submit, gcloud, Airflow.
 * Uses shiki-magic-move token-level transitions.
 */
const STEPS = [
  {
    label: "spark-submit",
    code: `spark-submit \\
  --master yarn \\
  --deploy-mode cluster \\
  --class com.example.MyJob \\
  gs://my-bucket/jars/my-job.jar \\
  --date 2026-05-17`
  },
  {
    label: "gcloud",
    code: `gcloud dataproc jobs submit spark \\
  --cluster=my-cluster \\
  --region=us-central1 \\
  --class=com.example.MyJob \\
  --jars=gs://my-bucket/jars/my-job.jar \\
  -- --date 2026-05-17`
  },
  {
    label: "Airflow",
    code: `DataprocSubmitJobOperator(
  task_id="run_job",
  region="us-central1",
  job={
    "placement": {"cluster_name": "my-cluster"},
    "spark_job": {
      "main_class": "com.example.MyJob",
      "jar_file_uris": ["gs://my-bucket/jars/my-job.jar"],
      "args": ["--date", "{{ ds }}"]
    }
  }
)`
  }
];

export function CodeMorph() {
  const [i, setI] = useState(0);
  const [highlighter, setHighlighter] = useState<Awaited<ReturnType<typeof loadHighlighter>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadHighlighter().then((h) => {
      if (!cancelled) setHighlighter(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-elev)]/70 backdrop-blur">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] px-4 py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          one job, three ways
        </p>
        <div className="flex gap-1">
          {STEPS.map((s, idx) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setI(idx)}
              className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition ${
                idx === i
                  ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)]"
                  : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 text-sm leading-relaxed">
        {highlighter ? (
          <ShikiMagicMove
            lang="bash"
            theme="github-dark"
            highlighter={highlighter}
            code={STEPS[i].code}
            options={{ duration: 600, stagger: 3, lineNumbers: false }}
          />
        ) : (
          <pre className="font-mono text-xs text-[var(--color-fg)]">{STEPS[i].code}</pre>
        )}
      </div>
    </div>
  );
}

async function loadHighlighter() {
  const { createHighlighter } = await import("shiki");
  return createHighlighter({
    themes: ["github-dark"],
    langs: ["bash", "python", "typescript"]
  });
}
