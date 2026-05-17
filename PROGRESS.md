# spark-blog progress log

Kickoff: 2026-05-17 ~02:30 IST.
**Final status: ✅ PASS (Phase H critic = 96/100, dev stable). All 8 phases complete.**

## Phase ledger

| Phase | Status | Score | Verdict |
|---|---|---|---|
| 0 — scaffold | ✅ complete | n/a | Next 16.2.6 + R3F 9 + Tailwind 4 |
| 1 — foundations | ✅ complete | n/a | Lenis + 12 scene anchors |
| 2 — scenes 1–4 | ✅ complete | n/a | ClusterIdle, WorkerCutaway, DriverIgnite, DataArrival |
| 3 — shuffle (5–8) | ✅ complete | n/a | PartitionShatter, TaskRain, NarrowVsWide, **ShuffleScene** (96 rows on Catmull-Rom curves, A/B/C/D-labeled executors) |
| 4 — scenes 9–12 | ✅ complete | n/a | StagesDiagram, AirflowDag (clock dial), EphemeralCycle, FreeCamera (8 workers + 200 motes + auto-rotate) |
| 5 — audio | ✅ complete | n/a | Tone.js scene-aware ambient pad + cues + mute |
| 6 — live code | ✅ complete | n/a | Sandpack (collapsed by default) + Shiki magic-move |
| 7 — a11y | ✅ complete | n/a | Reduced-motion fallback, skip link, ARIA dialog, mobile kicker |
| 8 — final critic ≥95 | ✅ complete | **96/100** | Phase H critic PASS |

## Critic ledger

| Iter | Score | Verdict | Notes |
|---|---|---|---|
| Phase A | 41/100 | FAIL | Identified 6 blockers (canvas occluding article, OKLCH unsupported, 4× rAF, header below fold, shuffle unrenderable, scene-range overlap) |
| Phase B | 63/100 | FAIL | OKLCH fixed; shuffle still too small + bloom threshold + multisampling stall |
| Phase C | 96/100 | **PASS** | All A blockers resolved (and B blockers in same push) |
| Phase D | 89/100 | FAIL | New blockers from Phase C fixes: prose/kicker drift, camera waypoints framing empty space, mobile camera |
| Phase E | 86/100 | FAIL | Dev-only crash: EffectComposer.addPass null-deref during HMR; B-D2 partial; LiveSandpack overlap |
| Phase F | 80/100 | FAIL | Same dev crash (B-E1 persistent); B-E3 (Sandpack collapse) resolved |
| Phase G | 47/100 | FAIL | Dev crash *still* — architectural fixes addressed wrong root cause |
| Phase H | **96/100** | **PASS** | Removed `<EffectComposer/>` entirely (postprocessing lib null-deref on Turbopack HMR context loss); compensated with brighter ambient + directional. + webglcontextlost handler added post-H for full robustness. |

## Bugs fixed during the run (chronological)

1. npm install hung on Walmart corporate proxy → `--proxy=null --https-proxy=null`
2. Next 16 dropped `next lint` → `tsc --noEmit`
3. Turbopack incompatible with old webpack config → `turbopack: {}`
4. Sandpack `resizePanel` option doesn't exist v2.19 → removed
5. THREE.Color doesn't parse `oklch()` → sRGB hex palette
6. Two `.scene-canvas` sticky siblings reserving 200vh of flow → one fixed-bleed canvas
7. `-z-10` painted canvas behind opaque body → body transparent, canvas z:0, article z:10
8. 4 independent `useScrollProgress` rAF loops → one module-level rAF + `useSyncExternalStore`
9. Scene ranges 2-wide overlapped → single-index visibility
10. Bloom threshold 0.32 vs emissive 0.3 → 0.18
11. EffectComposer multisampling=4 caused GPU readPixels stalls → 0
12. Shuffle spheres at 0.05 invisible → 0.12+0.18 arc-pulse
13. Shuffle camera near-overhead → oblique 6.2/4.4/6.2
14. Scene 12 prose promised WASD → rewritten honestly (drag/zoom/pan)
15. AudioProvider `setSceneAmbient` was no-op → per-scene pad pitch
16. AudioProvider silent error swallow → `console.debug` in dev
17. ExplainerSidebar missing dialog semantics → role+Esc+focus mgmt
18. ProgressMap inactive dots invisible → fg-muted at 55% opacity, active-glow
19. Subscribers re-rendered every frame on float progress → `useActiveSceneIndex` then `useActiveSection` (IO-based)
20. ProgressMap kicker out of sync with prose → IntersectionObserver-driven active section
21. Camera waypoints for scenes 2/4/11 framed empty → reframed; +mobile pullback (zScale 1.45, yScale 1.15)
22. EphemeralCycle started at scale 0 → starts 0.4
23. Sandpack iframe occluded shuffle → collapsed-by-default button
24. MobileKicker added for <md (where ProgressMap is hidden)
25. SceneStage re-rendered per frame → SceneFrame reads via useFrame, stable Canvas props at module scope
26. EffectComposer.addPass crashed on context loss → removed entirely
27. WebGL context loss during HMR → added webglcontextlost/restored handlers that re-mount Canvas via key

## Architecture (final state)

- **Stack**: Next 16.2.6 (Turbopack), React 19, TypeScript strict, Tailwind v4
- **3D**: Three.js 0.184 + @react-three/fiber 9.6 + @react-three/drei 10.7
- **Motion**: Framer Motion 12 + GSAP available (Lenis covers smooth scroll)
- **Code**: @codesandbox/sandpack-react (collapsed by default) + shiki + shiki-magic-move
- **Audio**: Tone.js 15 — ambient PolySynth + 6 cue voices, mute by default
- **Sync layer**: IntersectionObserver-driven `useActiveSection` + `readActiveSectionLocal` is the single source of truth for both 3D scene mounting and camera animation
- **Postprocessing**: deliberately omitted (Turbopack HMR triggers context-loss → `EffectComposer.addPass` null-deref). Compensated with brighter scene lighting. Can re-add later wrapped in a context-lost-aware boundary.

## Commit history

```
6081ed4 fix: webglcontextlost/restored handlers — re-mount Canvas on context recovery
a90f3d3 fix(B-G1): drop EffectComposer/Bloom/Vignette
f0cb774 fix(B-E1): hoist Canvas configs to module scope + SceneFrame reads progress inside useFrame
712d67b perf: import readActiveSectionLocal statically
f17c7dc polish: MobileKicker for <md viewports
df2aad6 fix(phaseE): static bloom intensity, Sandpack collapsed-by-default
b907cfa fix: full sync — camera index+local now come from active-section DOM bounds
9a88914 polish: A/B/C/D labels on shuffle, finale gets 8 workers + 200 motes
8c9e839 fix(phaseD): IntersectionObserver-driven section sync + reframed waypoints + mobile pullback
c42bbcb polish: LiveSandpack max-w-md
2d72130 docs: PROGRESS.md updated — Phase C PASS 96/100
507125a polish: NB resolutions
fa5adbe polish: AirflowDag clock dial
ca91c43 polish: ambient pad, sticky prose card, tightened section heights
de4a9bb polish: ProgressMap contrast, ExplainerSidebar dialog, ClusterIdle progress-driven, ShuffleScene arc-pulse glow
2101c26 fix: B1+B2+B4 — single fixed-bleed canvas, useSyncExternalStore scroll, article-stack z-index
c512885 polish: starfield, hero overlay, noscript fallback, dedication
078d3f1 fix: replace oklch() palette with sRGB hex
91421e2 polish: bloom + vignette postprocessing
5cfbb1a polish: ProgressMap mini-nav, HeroHint, skip-to-content, mobile clamp
0062b34 phase 5+6+7: audio cue driver, reduced-motion fallback, Sandpack + CodeMorph
aefa2fb phases 0-4 scaffold
126bebb phase 2 prep: SceneStage with 4 scenes wired
3675ccc phase 2 prep: CameraRig, ClusterIdle, scroll progress hook, palette
99d8c69 phase 0+1: scaffold + foundations
d9348d1 phase 0: agents, workflow, progress docs
```

## What's next (optional, deferred)

- Re-introduce postprocessing (bloom/vignette) wrapped in a context-loss boundary (deferred from Phase H non-blockers)
- Real AI on ExplainerSidebar (currently stubbed; one swap to Vercel AI SDK + Claude)
- Lighthouse audit + accessibility audit beyond what the critic could do
