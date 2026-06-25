import type { Metadata } from "next";
import "./globals.css";

const title = "Build a Spark cluster you can fly through";
const description =
  "An interactive, scroll-driven WebGL explainer for Apache Spark on Google Dataproc, orchestrated by Apache Airflow.";

// Resolve the canonical origin so OpenGraph/Twitter image URLs are absolute.
// Vercel injects these at build/runtime; falls back to the dev port locally.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3737";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `spark-blog — ${title}`,
    template: "%s — spark-blog"
  },
  description,
  openGraph: {
    type: "website",
    siteName: "spark-blog",
    title,
    description,
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Geist+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="bg-grain min-h-screen">{children}</body>
    </html>
  );
}
