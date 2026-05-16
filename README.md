# spark-blog

An interactive long-form explainer for Apache Spark on Google Dataproc orchestrated by Apache Airflow.

Built in the Bartosz Ciechanowski school of scroll-driven WebGL explainers, with three 2026-tier upgrades: spatial ambient audio (Hollywood-space-movie style), live editable code, and an inline AI tutor.

## Dev

```bash
npm install
npm run dev -- -p 3737
# open http://localhost:3737/spark
```

## Architecture

- **Next.js 15** App Router, TypeScript strict, static export.
- **react-three-fiber** for every scene under `components/three/`.
- **GSAP ScrollTrigger** + **Lenis** drive a single camera rig in `components/scroll/CameraRig.tsx`.
- **Tone.js** patches in `components/audio/sceneAudio.ts` keyed to scroll progress.
- **Sandpack** at scene 8 (live shuffle key editor).
- **shiki-magic-move** at scene 10 (`spark-submit` ↔ Airflow operator).
- **MDX** prose at `app/spark/content.mdx`.

## Agents

This repo is built by a Lead / Worker / Critic multi-agent loop. See `AGENTS.md` and `WORKFLOW.md`.
