"use client";

import { ReactNode } from "react";
import { SceneMeta } from "@/lib/scenes";

/**
 * One scroll section, ~200vh tall, holding the prose for a scene.
 * The 3D scene canvas is a sibling sticky element that listens to scroll
 * position globally — not a child here.
 */
export function SceneSection({ scene, children }: { scene: SceneMeta; children?: ReactNode }) {
  return (
    <section
      id={`scene-${scene.id}`}
      data-scene-id={scene.id}
      data-scene-index={scene.index}
      className="relative mx-auto flex min-h-[180vh] max-w-3xl items-start px-6 py-[40vh]"
    >
      <div className="sticky top-[18vh] max-w-xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          {scene.kicker}
        </p>
        <h2 className="mb-6 font-serif text-4xl leading-[1.1] md:text-5xl">{scene.title}</h2>
        <p className="text-lg leading-relaxed text-[var(--color-fg)] md:text-xl">{scene.body}</p>
        <p className="mt-6 border-l-2 border-[var(--color-accent)] pl-4 font-serif text-base italic text-[var(--color-fg-muted)]">
          {scene.concept}
        </p>
        {children}
      </div>
    </section>
  );
}
