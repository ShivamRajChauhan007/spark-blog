import { ImageResponse } from "next/og";

// Dynamically generated social-card image (1200×630). Next.js wires this file
// into og:image and twitter:image automatically for this route and its
// children (so /spark inherits it too). No binary asset to commit, and it's
// rendered on Vercel at request time — no fonts fetched, system defaults only.

export const alt = "Build a Spark cluster you can fly through — an interactive Spark explainer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const WORKERS = [
  { x: -260, y: -130 },
  { x: 260, y: -130 },
  { x: -260, y: 130 },
  { x: 260, y: 130 }
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "radial-gradient(120% 120% at 50% 40%, #1c1e26 0%, #0b0c11 70%)",
          color: "#f6f6fa",
          fontFamily: "Georgia, serif",
          position: "relative"
        }}
      >
        {/* cluster diagram, right side */}
        <div
          style={{
            position: "absolute",
            right: 70,
            top: 0,
            bottom: 0,
            width: 460,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {WORKERS.map((w, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 230 + w.x / 2 - 26,
                top: 315 + w.y - 26,
                width: 52,
                height: 52,
                borderRadius: 10,
                border: "3px solid #5fa8e5"
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 230 - 34,
              top: 315 - 34,
              width: 68,
              height: 68,
              borderRadius: 12,
              border: "4px solid #e89856"
            }}
          />
        </div>

        {/* text, left side */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 70px",
            maxWidth: 720
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#e89856"
            }}
          >
            spark-blog
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.05, marginTop: 28 }}>
            <span>Build a Spark cluster</span>
            <span style={{ fontStyle: "italic" }}>you can fly through.</span>
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, marginTop: 30, color: "#b8b9c4" }}>
            An interactive WebGL explainer for Apache Spark on Dataproc + Airflow.
          </div>
        </div>
      </div>
    ),
    size
  );
}
