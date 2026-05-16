import { SCENES } from "@/lib/scenes";
import { SceneSection } from "@/components/scroll/SceneSection";
import { ClusterStageCanvas } from "@/components/three/ClusterStageCanvas";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import Link from "next/link";

export const metadata = {
  title: "Build a Spark cluster you can fly through — spark-blog"
};

export default function SparkArticle() {
  return (
    <>
      <SmoothScroll />
      <ClusterStageCanvas />
      <header className="relative mx-auto max-w-3xl px-6 pt-32 pb-12">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          spark-blog · scrolling explainer
        </p>
        <h1 className="mt-6 font-serif text-6xl leading-[1.02] md:text-8xl">
          Build a Spark cluster <em>you can fly through.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-[var(--color-fg-muted)]">
          Twelve scenes. One terabyte of imaginary data. One Airflow scheduler clock. Scroll to begin.
        </p>
      </header>

      <main role="main">
        {SCENES.map((scene) => (
          <SceneSection key={scene.id} scene={scene} />
        ))}
      </main>

      <footer className="mx-auto max-w-3xl px-6 py-32 text-center text-sm text-[var(--color-fg-muted)]">
        <p className="font-serif text-2xl italic">— end of the article —</p>
        <p className="mt-4">
          Built in the Bartosz Ciechanowski school, with 2026 tools. <Link href="/" className="underline">Back to landing</Link>.
        </p>
      </footer>
    </>
  );
}
