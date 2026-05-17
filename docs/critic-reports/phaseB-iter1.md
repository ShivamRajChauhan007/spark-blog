# Phase B — Critic Report (iteration 1)

**Run:** 2026-05-17
**Reviewer:** critic agent
**Dev server:** http://localhost:3737 (fresh, port confirmed)
**Browser:** Playwright Chromium 145, headless, viewport 1440x900 (desktop) and 375x812 (mobile, isMobile, dpr 2)
**Artifacts:**
- `/Users/s0k0f41/PersonalWorkSpace/spark-blog/docs/screenshots/phaseB/*.png` — 13 desktop scroll positions + 2 mobile + landing + shuffle-clean
- `/Users/s0k0f41/PersonalWorkSpace/spark-blog/docs/screenshots/phaseB/_console.json`
- `/Users/s0k0f41/PersonalWorkSpace/spark-blog/docs/screenshots/phaseB/_dom.json`
- `/Users/s0k0f41/PersonalWorkSpace/spark-blog/docs/screenshots/phaseB/_probe.json`

---

## Rubric scoring

| Category | Pts | Earned | Reasoning |
|---|---|---|---|
| Build & lint clean | 15 | **15** | `npm run lint` (tsc --noEmit) clean. `npm run build` clean — all 4 routes statically generated. No TS errors. |
| No console errors | 10 | **6** | Zero page errors. One real warning: `THREE.Clock: deprecated, use THREE.Timer` (THREE 0.184 deprecation). Four repeated WebGL "GPU stall due to ReadPixels" perf warnings (Postprocessing readPixels — fixable). One `requestfailed` for `https://2-19-8-sandpack.codesandbox.io/` (Sandpack bundler iframe) — broken egress from headless Chromium, but the same call may fail under CSP / restricted networks for real users too. |
| Scene completeness | 15 | **8** | All 12 sections present in DOM (`scene-hero` … `scene-fly`), labels rotate correctly through the ProgressMap kicker. **But two scenes are visually wrong:** (a) at scene 8 ("08 THE SHUFFLE"), the centerpiece arc rows are not visible — the screenshot shows lingering NarrowVsWide grid (range overlap [5,7] vs [6,8]) plus tiny invisible spheres. (b) at scene 10 ("10 ORCHESTRATION"), the DAG renders twice / overlapping with StagesDiagram. Camera rig moves through waypoints — confirmed for hero, anatomy, data, transformations, orchestration, fly. |
| The Shuffle | 15 | **5** | **The centerpiece does not deliver.** `ShuffleScene.tsx` renders sphereGeometry(radius 1) scaled to 0.05 — that is a 5cm sphere viewed from camera 6.5 units away with the camera placed at y=8.5 — nearly invisible. Bloom intensity 1.1 should help, but there is no perceptible bloom halo in the shuffle screenshot. The four executor cubes are 0.7 units (visible) but appear as static blocks because NarrowVsWide is still rendering the grid of green/blue cubes on top of the shuffle layout. No visible arc motion in screenshots; with Playwright's 700ms settle the animation should be in mid-flight. The Sandpack code editor mounted inside the shuffle section sits on top of the canvas at the top of the viewport (see 66% screenshot), occluding part of the scene. Audio cue (`chord`) is wired in but cannot be tested in headless. |
| Performance | 10 | **6** | InstancedMesh used appropriately (Shuffle 96, NarrowVsWide 32). dpr clamped [1, 1.8]. Postprocessing composer uses multisampling 4 — heavy. Measured RAF rate in headless = 7 fps (suspect, but the four "GPU stall due to ReadPixels" warnings reinforce that the composer is forcing readbacks). On Apple Silicon non-headless this should be 60 fps, but the readPixels stalls would cost real frames. |
| Accessibility | 10 | **7** | Skip-link present (`<a href="#main-content">skip to article</a>`) but uses class-based `.sr-only focus:not-sr-only` — it does work on focus, confirmed in DOM. ProgressMap uses `<nav aria-label="Scene navigator">` with `aria-current="true"` on the active dot and `aria-label` per anchor — good. Canvas marked `aria-hidden`. Reduced-motion fallback (`StubCanvas`) wired in `ClusterStageCanvas.tsx`. Mute toggle present. Missing: `<noscript>` is present (good). However each section's prose `<p>` and `<h2>` have no `aria-labelledby` to tie them together; not blocking. ExplainerSidebar trigger button found by text "+ EXPLAIN THIS" but no `aria-label` — relies on visual content only. |
| Code quality | 10 | **7** | Strict TS, mostly clean. One `any` cast in `SceneStage.tsx:75` (justified, but tag it). Components are single-purpose. Comments are decent. Concerns: (a) `LiveSandpack.tsx` theme uses `oklch(...)` colour strings inside Sandpack though the rest of the codebase migrated to sRGB hex — inconsistent (Sandpack may render via CSS so it's fine, but the comment about "Replaced OKLCH palette" in PROGRESS conflicts here). (b) `useAudio` throws when missing provider — fine, but the error message could be more specific. (c) `SceneStage.tsx` ranges `[6, 8]` etc allow simultaneous render of overlapping scenes — design choice but the consequence is visible scene pollution. |
| Audio polish | 5 | **3** | Tone.js lazy-loaded only on enable (good). Mute button toggled via header "♪ OFF" pill (confirmed in screenshots). SceneCueDriver fires one-shot cues per scene transition. Lacking real ambient pad — `setSceneAmbient` is a no-op (`// Phase 5: vary ambient pad pitch per scene` is a TODO). The brief says "Audio polish 5" — Phase B promised the cue driver and that exists, but no per-scene ambient layering. |
| Visual polish | 5 | **3** | Typography is good (serif "Build a Spark cluster *you can fly through.*" lands beautifully, kerning/italic shows real care). Hero composition strong. Starfield + vignette tasteful. **Cons:** the shuffle scene is visually flat (see Shuffle row above). Bloom is barely visible against the dark background — luminanceThreshold 0.32 with materials at emissiveIntensity 0.3 means bloom barely fires. The Sandpack code editor uses a different palette from the rest (light-amber accent in OKLCH vs sRGB hex elsewhere). |
| Mobile | 5 | **3** | Mobile hero (375x812) renders cleanly: title clamps, body text readable, no overflow. **But** at 50% scroll the mobile viewport shows only a single floating orange cube — no scene label (ProgressMap hidden behind `md:flex`, which is correct), and no in-section prose visible because the section spans 200vh and the prose is anchored 60vh in — so mid-scene you see only canvas. The ExplainerSidebar button is anchored bottom-right and overlaps the "N" nav badge in the bottom-left at mobile — not collision but cramped. No on-screen scene kicker on mobile, leaving mobile users without scene-of-12 context. |

**Total: 63 / 100 — FAIL**

---

## Blocking issues (must fix before phase advance)

### S1 — Shuffle centerpiece does not show arcs (severity: critical)
- File: `components/three/scenes/ShuffleScene.tsx:78` and `:100-103`
- Sphere geometry is radius 1, scaled to 0.05 → effective radius 0.05. From the y=8.5 overhead camera (CameraRig.tsx:31, `[0, 8.5, 6.5]`), 96 dots that small are sub-pixel. Either bump scale (e.g. 0.18–0.25) or geometry args to `[0.18, 12, 12]` and keep `setScalar(1)`.
- The brief calls this "the centerpiece scene is visceral — arcs, audio, mobile-OK". As shipped, arcs are not visible.
- Also: `meshBasicMaterial` does not respond to lights — but `setColorAt` is being called every frame on it; since basic material ignores normals, the color shift looks flat. Consider `meshStandardMaterial` with `emissive=instance color`, or accept basic but increase scale.

### S2 — Scene range overlap pollutes Shuffle view (severity: critical)
- File: `components/three/SceneStage.tsx:29-30`
- `NarrowVsWide` range `[5, 7]` and `ShuffleScene` range `[6, 8]` both render at index 7 (zero-based, i.e. scene 8). Result: the green/blue static grid of NarrowVsWide sits in the middle of the shuffle stage. See `screenshots/phaseB/shuffle-clean.png`.
- Fix: tighten ranges (e.g. NarrowVsWide `[5, 6]`, Shuffle `[6, 8]`), or add a small `progress` fade-out in NarrowVsWide so it dims to invisible by index 7.

### S3 — Stages + Airflow render simultaneously (severity: high)
- File: `components/three/SceneStage.tsx:31-32` — `StagesDiagram` range `[7, 9]` and `AirflowDag` `[8, 10]` both visible at index 8 and 9. Screenshot at 75% shows two rows of three nodes overlapping (visible aliasing).
- Fix: same approach — fade-out via `local`/`progress` or non-overlapping ranges.

### S4 — Bloom + readPixels GPU stall (severity: high)
- File: `components/three/SceneStage.tsx:79-82`
- Four repeated `GL_CLOSE_PATH_NV ... GPU stall due to ReadPixels (this message will no longer repeat)` warnings appear in the desktop console. This is from EffectComposer's read-back during postprocessing. With `multisampling={4}` the composer is forced to MSAA-resolve to a non-render-target. Lower `multisampling` to 0 (FXAA inside Bloom is enough) or set `frameBufferType` explicitly. This is the prime suspect for the 7 fps measurement.

### S5 — Bloom barely visible (severity: medium)
- File: `components/three/SceneStage.tsx:45-48`, scene emissive at `emissiveIntensity={0.3}` (e.g. `WorkerCutaway`, `ShuffleScene` executors)
- `luminanceThreshold={0.32}` means anything below 0.32 luminance is excluded. Scene 8 executors at emissiveIntensity 0.35 against dark BG — they probably *just* clear the threshold but the halo is invisible in the 66% / shuffle-clean screenshots. Either lower threshold to 0.15–0.2 or raise emissiveIntensity on the centerpieces.

### S6 — Sandpack failed request + on-canvas overlap (severity: medium)
- File: `components/code/LiveSandpack.tsx`
- `GET https://2-19-8-sandpack.codesandbox.io/ — net::ERR_ABORTED`. May be transient (Fast Refresh interrupt) but also a CSP-friendliness concern. Confirm Sandpack works after a hard refresh on a clean network.
- The Sandpack panel renders inside the prose column of the shuffle section (`SceneSection` is `max-w-3xl`, the panel pushes the section taller). At 66% scroll it overlays the canvas. Visually the floating code at the very top of the viewport feels disconnected from the shuffle below it (see `phaseB/66.png`). Consider repositioning or letting the section's content scroll past the canvas more.

### S7 — Sandpack uses OKLCH against the project's sRGB migration (severity: medium)
- File: `components/code/LiveSandpack.tsx:18-47`
- Every theme colour is an `oklch(...)` string. Some browsers / Sandpack iframe might not honour OKLCH. Replace with sRGB hex to match the rest of the codebase post-OKLCH-removal.

### S8 — Mobile mid-scroll dead air (severity: medium)
- File: `components/scroll/SceneSection.tsx:17`, `components/ui/ProgressMap.tsx:17` (`md:flex`)
- Mobile users see only the canvas mid-scene with no scene label or kicker because the prose is anchored at `py-[60vh]`. Add a small fixed scene-kicker pill that shows on `< md` viewports, mirroring the ProgressMap label.

---

## Non-blocking nice-to-haves

- N1 — `SceneStage.tsx:75` uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any`. Replace with a discriminated union: every scene component implements `(props: { progress: number; visible: boolean })`. Drop the `any` cast.
- N2 — `THREE.Clock deprecated` warning — non-fatal, but file an issue / pin a version note. Three 0.184 will eventually pull in Timer.
- N3 — `app/spark/page.tsx:28` skip-link reads "skip to article" — convention is "Skip to main content" / "Skip to content". Aligns better with `id="main-content"`.
- N4 — `app/spark/page.tsx:34` audio toggle and ProgressMap both anchor right edge but ProgressMap is `right-3` and toggle `right-6 top-6` — toggle could collide with first ProgressMap dot on short viewports. Anchor toggle at `top-6 left-6` or move ProgressMap to `top-1/3`.
- N5 — `AudioProvider.tsx:75-82` `setSceneAmbient` is a no-op. Phase 5 deliverable, but the brief says audio cue driver is shipped. Document the gap in PROGRESS or implement a one-line gain envelope.
- N6 — `CodeMorph.tsx:51` highlighter is created with bash/python/typescript but `STEPS[1]` (`gcloud`) is technically `shell` not `bash` — minor.
- N7 — `LiveSandpack.tsx:50` `editorHeight: 240` — small enough that scrolling the editor competes with page scroll on touch devices. Increase to 280 or add `touch-action` styling.
- N8 — Hero subtitle in mobile-0 wraps a hyphen ("Bartoss"-name). Looks fine but check on narrower devices (320px).
- N9 — No `preconnect` to sandpack.codesandbox.io / esm.sh in `<head>`. A `link rel="preconnect"` would shave time off the live editor warm-up.
- N10 — No favicon / OG image observed. `app/layout.tsx` likely missing `metadata.openGraph` / favicon.

---

## What works (credit where due)

- Hero typography is genuinely beautiful — the italic "you can fly through." sells the article in one frame.
- ProgressMap is invisible-until-needed and the active-kicker label slides out gracefully (visible in screenshots at scene 4, 7, 8, 10, 12).
- Twelve sections, twelve scenes, correct ids/aria-labels, correct kickers.
- Skip-link is implemented, reduced-motion fallback wired (StubCanvas), Tone.js lazy-loaded.
- The build is clean (`next build` succeeds, no type errors, no lint errors).
- Page error count: zero.

---

## Verdict

**FAIL — 63 / 100.** Phase advance blocked until score ≥ 95.

Top three blockers (descending severity):
1. **S1 + S2** — Scene 8 "The Shuffle" does not visually show arcs flying between executors (sphere radius too small, NarrowVsWide overlap pollutes the stage). The centerpiece must be visceral; right now it reads as static.
2. **S4** — EffectComposer multisampling=4 + Bloom is causing GPU readPixels stalls (four repeated warnings); this is the prime suspect for sluggish frame rate.
3. **S3 + S6 + S7** — Stages and Airflow scenes overlap visually at scene 9 / 10 boundary; Sandpack iframe failed to load (`ERR_ABORTED`) and its theme still uses OKLCH despite the sRGB migration.

Next iteration must address S1–S4 at minimum. S5–S8 should land in the same pass if possible.
