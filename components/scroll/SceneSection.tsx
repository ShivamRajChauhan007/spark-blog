"use client";

import { ReactNode } from "react";
import { SceneMeta } from "@/lib/scenes";
import { SceneCanvas } from "@/components/three/SceneCanvas";

/**
 * One scroll section. Prose and 3D canvas share a single rounded card on md+:
 * prose padded on the left half, canvas flush on the right half, divided by a
 * subtle vertical hairline. The card itself carries the border, backdrop blur
 * and shadow so the two halves read as one unit. Each canvas is its own r3f
 * tree with OrbitControls, mounted lazily when the section enters viewport.
 *
 * On mobile: stacks — canvas above prose. Reader scrolls naturally.
 */
export function SceneSection({ scene, children }: { scene: SceneMeta; children?: ReactNode }) {
  return (
    <section
      id={`scene-${scene.id}`}
      data-scene-id={scene.id}
      data-scene-index={scene.index}
      className="relative mx-auto max-w-6xl px-6 py-16 md:py-24"
    >
      <div className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-bg-elev)]/40 shadow-2xl backdrop-blur">
        <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <div className="p-8 md:p-10">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
              {scene.kicker}
            </p>
            <h2 className="mb-8 font-serif text-4xl leading-[1.08] md:text-5xl">{scene.title}</h2>
            <div className="space-y-5 text-base leading-[1.7] text-[var(--color-fg)] md:text-lg">
              {scene.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <p className="mt-8 border-l-2 border-[var(--color-accent)] pl-4 font-serif text-base italic text-[var(--color-fg-muted)]">
              {scene.concept}
            </p>
            {scene.sources && scene.sources.length > 0 && (
              <ul className="mt-6 space-y-1 font-mono text-[11px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                {scene.sources.map((s) => (
                  <li key={s.href}>
                    <span className="text-[var(--color-fg-muted)]/60">↗</span>{" "}
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border-b border-dashed border-[var(--color-line)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {children}
          </div>

          <div className="md:order-2 md:border-l md:border-[var(--color-line)]/60">
            <SceneCanvas scene={scene} />
          </div>
        </div>
      </div>
    </section>
  );
}
