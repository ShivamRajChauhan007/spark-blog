import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "spark-blog — Build a Spark cluster you can fly through",
  description: "An interactive scroll-driven explainer for Apache Spark on Google Dataproc + Airflow."
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
