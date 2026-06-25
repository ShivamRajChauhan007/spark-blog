import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
        spark-blog · prototype
      </p>
      <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">
        Build a Spark cluster <em>you can fly through.</em>
      </h1>
      <p className="max-w-xl text-lg text-[var(--color-fg-muted)]">
        An interactive, scroll-driven explainer for Apache Spark on Google Dataproc, orchestrated by Apache Airflow. Hand-rolled WebGL,
        live editable code, and sixteen scenes you can fly through.
      </p>
      <Link
        href="/spark"
        className="rounded-full border border-[var(--color-line)] bg-[var(--color-bg-elev)] px-6 py-3 font-mono text-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
      >
        Enter the article →
      </Link>
    </main>
  );
}
