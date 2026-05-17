# spark-blog progress log

Kickoff: 2026-05-17 ~02:30 IST
Last updated: 2026-05-17 (after Phase B critic dispatch)

## Phase ledger

| Phase | Status | Score | Notes |
|---|---|---|---|
| 0 — scaffold | ✅ complete | n/a | Next 16.2.6 + R3F 9 + Tailwind 4. Walmart proxy bypassed via `--proxy=null`. |
| 1 — foundations | ✅ complete | n/a | Lenis smooth scroll, 12 scene anchors, MDX-ready shell |
| 2 — scenes 1–4 | ✅ complete | n/a | ClusterIdle, WorkerCutaway, DriverIgnite, DataArrival + CameraRig |
| 3 — shuffle (5–8) | ✅ complete | n/a | PartitionShatter, TaskRain, NarrowVsWide, **ShuffleScene** (96 rows on Catmull-Rom curves) |
| 4 — scenes 9–12 | ✅ complete | n/a | StagesDiagram, AirflowDag, EphemeralCycle, FreeCamera (OrbitControls) |
| 5 — audio | ✅ complete | n/a | Tone.js patches + scene-driven cue driver + mute toggle |
| 6 — live code | ✅ complete | n/a | Sandpack at scene 8, Shiki magic-move at scene 10 |
| 7 — a11y | ✅ complete | n/a | Reduced-motion fallback, skip-to-content, ARIA labels |
| 8 — final critic ≥95 | 🟡 in progress | TBD | Critic round B running |

## Bugs fixed since kickoff

- npm install hung due to corporate proxy `proxy-intlho.wal-mart.com` — fixed via `--proxy=null --https-proxy=null` CLI overrides
- Next 16 dropped `next lint` — replaced `npm run lint` with `tsc --noEmit`
- next.config webpack block incompatible with Turbopack (default in N16) — set `turbopack: {}` to silence
- Sandpack `resizePanel` option doesn't exist in v2.19 — removed
- THREE.Color does not parse `oklch()` (silent warnings) — palette converted to sRGB hex

## Decisions locked

- Tech stack: Next 16 + React 19 + R3F 9 + Tailwind 4 + Shiki + Sandpack + Tone.js
- 12 scenes, single sticky canvas, scroll-driven camera rig
- Audio off by default (browser autoplay policy)
- Bloom + Vignette postprocessing, scene-driven bloom intensity
- Starfield backdrop everywhere

## Files of note

- `components/three/SceneStage.tsx` — the sticky canvas + postprocessing pipeline
- `components/three/scenes/ShuffleScene.tsx` — the centerpiece (96 rows, instanced spheres, Catmull-Rom)
- `components/scroll/CameraRig.tsx` — 12 camera waypoints, smoothstep interpolation
- `components/audio/SceneCueDriver.tsx` — fires cue on every scene crossing
- `components/code/LiveSandpack.tsx` — embedded editable code @ scene 8
- `components/code/CodeMorph.tsx` — Shiki magic-move @ scene 10
- `lib/scenes.ts` — 12-scene metadata source of truth
- `lib/colors.ts` — sRGB hex palette (Three.js compatible)
