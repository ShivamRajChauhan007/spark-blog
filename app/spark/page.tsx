import { SCENES } from "@/lib/scenes";
import { SceneSection } from "@/components/scroll/SceneSection";
import { ClusterStageCanvas } from "@/components/three/ClusterStageCanvas";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { SceneCueDriver } from "@/components/audio/SceneCueDriver";
import { AudioToggle } from "@/components/ui/AudioToggle";
import { ExplainerSidebar } from "@/components/ai/ExplainerSidebar";
import { LiveSandpack } from "@/components/code/LiveSandpack";
import { CodeMorph } from "@/components/code/CodeMorph";
import { ProgressMap } from "@/components/ui/ProgressMap";
import { MobileKicker } from "@/components/ui/MobileKicker";
import { HeroHint } from "@/components/ui/HeroHint";
import Link from "next/link";

export const metadata = {
  title: "Build a Spark cluster you can fly through — spark-blog"
};

export default function SparkArticle() {
  return (
    <AudioProvider>
      <SmoothScroll />
      <SceneCueDriver />
      <ClusterStageCanvas />
      <div className="article-stack">

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:border focus:border-[var(--color-line)] focus:bg-[var(--color-bg-elev)] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:text-[var(--color-fg)]"
      >
        skip to article
      </a>

      <div className="fixed right-6 top-6 z-30 flex items-center gap-3">
        <AudioToggle />
      </div>

      <ProgressMap />
      <MobileKicker />
      <HeroHint />

      <noscript>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-elev)] p-4 font-mono text-sm text-[var(--color-fg-muted)]">
            This article uses scroll-driven WebGL and live editable code; please enable JavaScript to view the full experience.
          </p>
        </div>
      </noscript>

      <header className="relative mx-auto max-w-3xl px-6 pt-32 pb-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-[120vh] bg-gradient-to-b from-[var(--color-bg)]/85 via-[var(--color-bg)]/40 to-transparent" />
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
          spark-blog · scrolling explainer
        </p>
        <h1 className="mt-6 font-serif text-6xl leading-[1.02] md:text-8xl">
          Build a Spark cluster <em>you can fly through.</em>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-[var(--color-fg-muted)]">
          Twelve scenes. One terabyte of imaginary data. One Airflow scheduler clock. Scroll to begin.
        </p>
        <p className="mt-12 max-w-md font-serif text-base italic text-[var(--color-fg-muted)]">
          In the school of Bartosz Ciechanowski. With 2026 tools.
        </p>
      </header>

      <main role="main" id="main-content">
        {SCENES.map((scene) => (
          <SceneSection key={scene.id} scene={scene}>
            {scene.id === "shuffle" && <LiveSandpack />}
            {scene.id === "airflow" && <CodeMorph />}
          </SceneSection>
        ))}
      </main>

      <ExplainerSidebar />

      <footer className="mx-auto max-w-3xl px-6 py-32 text-center text-sm text-[var(--color-fg-muted)]">
        <p className="font-serif text-2xl italic">— end of the article —</p>
        <p className="mt-4">
          Built in the Bartosz Ciechanowski school, with 2026 tools. <Link href="/" className="underline">Back to landing</Link>.
        </p>
      </footer>
      </div>
    </AudioProvider>
  );
}
