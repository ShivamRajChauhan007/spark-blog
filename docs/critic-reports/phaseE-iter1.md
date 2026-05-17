# Critic report — phase E, iteration 1

- **Date:** 2026-05-17
- **Phases under review:** Post-Phase-D fixes — new `lib/useActiveSection.ts` IntersectionObserver source-of-truth for ProgressMap / ExplainerSidebar / SceneCueDriver / SceneStage scene selection (decoupled from scroll-progress float); rewritten `CameraRig` waypoints for scenes 2 / 4 / 11; mobile pullback (`zScale=1.45 yScale=1.15` when `size.width < 640`); `EphemeralCycle` baseline scale 0→0.4.
- **Dev server:** `http://localhost:3737` (freshly restarted). Also independently exercised against a freshly-built **production** build on port 3738 to disambiguate dev-only HMR artefacts from real bugs.
- **Verdict:** **FAIL** — total **86 / 100** (need ≥95)
- **Screenshots (PRODUCTION build = canonical):** `docs/screenshots/phaseE/{0,8,16,25,33,42,50,58,66,75,83,92,100,landing,mobile-0,mobile-33,mobile-50,mobile-75}.png`, `_console.json`, `_errors.txt`, `_dom.json`, `_mobile_state.json`.
- **Dev-server crash evidence:** `docs/screenshots/phaseE-dev-crash/{0,8,16,...}.png`, `_console.json`, `_errors.txt`. Identical structure, but the dev-mode page mounts cleanly, then crashes on first scroll.
- **Tool note:** Cached Playwright Chromium at `~/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`; harnesses at `/tmp/spark-critic-phaseE.mjs` (initial run, `networkidle`), `/tmp/spark-critic-phaseE-v2.mjs` (dev, `domcontentloaded` + `waitForSelector("canvas")` — confirms the crash is on first scroll), `/tmp/spark-critic-prod.mjs` + `/tmp/spark-critic-prod-shots.mjs` (production build on port 3738, full screenshot suite). Production server started with `npx next start -p 3738`.

---

## Executive summary

Two of three Phase D blockers are **substantially resolved** by the new `useActiveSection` IntersectionObserver. At every desktop **and mobile** scroll sample, the `mostVisibleSection` (= the `<section data-scene-id>` with the largest in-viewport ratio), the closest-in-viewport `<h2>`'s `data-scene-id`, and the active ProgressMap pill all agree by construction. The kicker pill at scroll 50 % now reads **`06 · PARALLELISM`** while the prose `<h2>` reads **"Tasks, in parallel."** and the canvas renders **TaskRain** — the systematic 4-of-8 mismatch from Phase D is gone (B-D1 resolved).

Camera framing is *better* but **not fully fixed**. The Phase D blocker B-D2 listed three empty-canvas scrolls (16 %, 25 %, 83 %). After the worker fix:
- **scroll 25 % (driver)** now reads beautifully — orange driver JVM cube with halo, framed centre-screen.
- **scroll 92 % (ephemeral)** — master + 4 worker cubes visible from scene start; the 0.4 baseline scale fix is doing exactly what it says.
- **scroll 16 % (anatomy)** **still shows only starfield** — see B-E2 below. The worker cube sits at `[3.2, 0, 0]` and the anatomy camera waypoint `pos:[5.0,1.5,4.2] look:[3.2,0,0]` *should* frame it, but at scroll 16 % the float-based `activeScene(0.16, 12)` returns `idx=1, local=0.92` and the rig is therefore **92 % of the way from anatomy to driver**, looking at `[≈0,≈0,≈0]` with the worker cube off-screen to the right. The IO-based scene-render and float-based camera-interpolation disagree.

Mobile mid-scroll (B-D3) is **resolved**. At `mobile-50.png` (375 × 812) the canvas shows the big orange driver cube plus a scatter of blue task balls — the `zScale=1.45 yScale=1.15` pullback works.

**However**, Phase E introduces a new and severe regression: the **dev server's `/spark` route crashes during the first user scroll** with `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass` (`components/three/SceneStage.tsx:73`). The Next.js dev runtime overlay then replaces the entire body with the error card (visible in `docs/screenshots/phaseE-dev-crash/16.png`, `25.png`, `33.png`, … — every dev screenshot from scroll 8 % onward is the overlay). The crash sequence: WebGL renderer logs `Context Lost`, then on the next React reconciliation the `EffectComposer` setup races a null `renderer.getContext()`. This is **dev-only** — the production build on port 3738 has **zero `pageerror`s** across the entire scroll suite and shows the article rendering correctly throughout. But because the instructions specified driving the dev server, the dev-crash is part of the Phase E evidence and the score must reflect it. A user opening `localhost:3737/spark` in dev mode currently sees the article for half a second and then the Next.js error overlay forever — until they reload, when the cycle repeats on first scroll.

The rest of the polish is intact: build is clean, lint is clean, prod console is silent except for the upstream `THREE.Clock` deprecation, all 12 sections render with full prose-canvas-kicker alignment, ShuffleScene at scroll 66 % is full-bloom + executor labels "A" / "B" + LiveSandpack overlay (NB1 from Phase D mostly retired by virtue of IO scene-selection — the canonical scroll for scene 8 is now exactly where the IO has scene 8 most-visible, and the shuffle reads as the centerpiece moment), the AirflowDag clock dial + 3-node DAG at scroll 83 % is gorgeous, scene 12 fly mode shows the cubes with the end-of-article footer.

---

## DOM probe at scroll 0 (production build, key facts)

From `docs/screenshots/phaseE/_dom.json`:

| Probe | Value | Interpretation |
|---|---|---|
| `h1.text` | `"Build a Spark cluster you can fly through."` | Real H1, not the dev-error overlay's `"This page couldn't load"` |
| `h1Y` | 168 px | H1 well within 900-px viewport (✓) |
| `scrollHeight` | 20156 px | Was 20336 in Phase D (200 px less due to small layout shifts) |
| `canvasCount` | 1 | Single canvas (B1+B2 still resolved) |
| `sectionMetrics` | 12 sections; indices 1..12 with `data-scene-id` in {hero, anatomy, driver, data-arrival, partitions, task-rain, narrow-vs-wide, shuffle, stages, airflow, ephemeral, fly} | All sections rendered; 180vh for 1..9 (height ≈ 1620), 140vh for 10..12 (height ≈ 1260) |

### Alignment matrix (production build, scrolls 0..100)

`docs/screenshots/phaseE/_dom.json` → `sceneStateRecords`:

| scroll % | scrollY | mostVisibleSection (id#index) | closest H2 sceneId | active ProgressMap kicker | aligned? |
|---|---|---|---|---|---|
| 0 | 0 | hero#1 | (none above 0) | `01 · The cluster` | ✓ |
| 8 | 1468 | hero#1 | hero | `01 · The cluster` | ✓ |
| 16 | 2937 | anatomy#2 | anatomy | `02 · Anatomy` | ✓ |
| 25 | 4589 | driver#3 | driver | `03 · The driver` | ✓ |
| 33 | 6058 | data-arrival#4 | data-arrival | `04 · The data` | ✓ |
| 42 | 7710 | partitions#5 | partitions | `05 · Partitions` | ✓ |
| 50 | 9178 | task-rain#6 | task-rain | `06 · Parallelism` | ✓ |
| 58 | 10646 | narrow-vs-wide#7 | narrow-vs-wide | `07 · Transformations` | ✓ |
| 66 | 12114 | shuffle#8 | shuffle | `08 · The shuffle` | ✓ |
| 75 | 13767 | stages#9 | stages | `09 · Stages` | ✓ |
| 83 | 15235 | airflow#10 | airflow | `10 · Orchestration` | ✓ |
| 92 | 16887 | ephemeral#11 | ephemeral | `11 · Ephemeral clusters` | ✓ |
| 100 | 18356 | fly#12 | fly | `12 · Fly mode` | ✓ |

**Every row aligns.** The Phase D mismatches at 25/42/50/75 % are gone.

### Mobile alignment (375 × 812, prod)

From `docs/screenshots/phaseE/_mobile_state.json`:

| scroll % | scrollY | mostVisibleSection | closest H2 sceneId | active kicker | aligned? |
|---|---|---|---|---|---|
| 0  | 0     | hero#1         | hero         | `01 · The cluster` | ✓ |
| 33 | 5479  | data-arrival#4 | data-arrival | `04 · The data` | ✓ |
| 50 | 8302  | task-rain#6    | task-rain    | `06 · Parallelism` | ✓ |
| 75 | 12453 | stages#9       | stages       | `09 · Stages` | ✓ |

Mobile mirrors desktop alignment exactly.

---

## Rubric

| Category | Score | Reasoning |
|---|---|---|
| **Build & lint clean** (15) | **15 / 15** | `npm run build` succeeds (Turbopack, 3.1 s, 4 static routes). `npm run lint` (= `tsc --noEmit`) is clean. No TS errors. |
| **No console errors** (10) | **4 / 10** | **Production:** zero `pageerror`s; only the upstream `THREE.Clock` deprecation warning and Chromium font-subsystem `unsupported GPOS/GSUB table LookupType` debug noise (unchanged from Phase D). **Dev:** the route crashes during the first user scroll with `TypeError: Cannot read properties of null (reading 'alpha')` at `components/three/SceneStage.tsx:73` originating from `EffectComposer.addPass` / `EffectComposer.setRenderer` inside the postprocessing library, preceded by `THREE.WebGLRenderer: Context Lost.`. 4 distinct `pageerror`s in the v2 run (with `domcontentloaded` and a `waitForSelector("canvas")`); 13 in the v1 run (with `networkidle` retries triggering more HMR cycles). The Next.js error overlay (`Runtime TypeError: Cannot read properties of null (reading 'alpha')` shown in `docs/screenshots/phaseE-dev-crash/25.png`) replaces the entire DOM, leaving the user with no article from scroll-8 % onward. Although the bug doesn't reproduce in the production build, the brief specified the dev server and a dev-mode user would experience exactly this. -6. |
| **Scene completeness** (15) | **11 / 15** | All 12 sections render with prose ↔ kicker ↔ canvas alignment at every canonical scroll (alignment matrix above). Scenes 1, 3 (driver), 4 (data prism), 5 (partitions shatter), 6 (task rain), 7 (narrow-vs-wide, no overlap pollution), 8 (shuffle with executor labels A/B + LiveSandpack), 9 (stages), 10 (airflow + clock dial), 11 (ephemeral cluster master+4 workers from start), 12 (fly mode cubes + end-of-article footer) all read cleanly. **Scene 2 (anatomy) is still empty at scroll 16 %** (`docs/screenshots/phaseE/16.png`): the kicker correctly reads `02 · ANATOMY`, the prose correctly reads "Inside a worker.", but the canvas shows only the starfield. The worker cube exists in scene and should be framed by the new waypoint, but the float-based camera interpolation (`activeScene(0.16, 12)` → `idx=1, local=0.92`) places the rig 92 % of the way through the anatomy→driver lerp, so the camera is looking near the origin while the worker sits at `[3.2, 0, 0]`. This is the same B-D2 phenomenon, partially fixed at the other two scenes by their geometry happening to remain in frustum across the lerp. **Minus 4** for one full scene's content missing at the canonical scoring scroll. |
| **The Shuffle** (15) | **14 / 15** | `66.png` shows the shuffle as the centerpiece: oblique angle with executor cubes labeled "A" / "B" (drei `<Text>` glyphs now visible — NB3 from Phase D resolved), arc tracks with bloom, and the LiveSandpack code editor inset on top showing the partitioner code with `case key % 4` matches. Decisive cinematic moment. The IO-based scene-selection means scroll 66 % now lands on shuffle's *visual peak* (because the section's mid-viewport overlaps the shuffle's local≈0.55 — the apex of the arcs), so NB1 from Phase D is also resolved. **Minus 1**: the LiveSandpack iframe occludes the upper third of the shuffle stage at this scroll. Either move the editor to a `md:` side panel or push the shuffle group down 1.5 world units when scene 8 is active. |
| **Performance** (10) | **9 / 10** | Single module-level rAF (`lib/useScrollProgress.ts`). `useActiveSection` adds one IntersectionObserver (12 thresholds × 12 sections = 12 callbacks max, very cheap). Single-index scene rendering still in effect (Phase C/D's `index === sceneIndex` collapse — `SceneStage.tsx:75-84`). `EffectComposer multisampling={0}` (`SceneStage.tsx:86`) still in place — no readPixels stalls in prod console. **Minus 1**: the `WebGLRenderer: Context Lost` event itself (which fires regardless of whether the error subsequently crashes) suggests something is creating then disposing a Canvas (or two Canvas instances are racing). On a production build this is recoverable; in dev it cascades into the alpha-null crash. |
| **Accessibility** (10) | **9 / 10** | Skip-link, `role="main"`, AudioToggle ARIA, `<nav aria-label>` on ProgressMap, `aria-current="true"` on the active scene pill (verified at every scroll — the IO source-of-truth means `aria-current` accurately tracks viewport state for screen-reader users), ExplainerSidebar dialog semantics + Esc + focus return (`ExplainerSidebar.tsx:29-42`), `<canvas aria-hidden>`, reduced-motion fallback (`ClusterStageCanvas.tsx`). **Minus 1**: NB5 from Phase D unchanged — mobile users (`< md`) get no scene-of-12 kicker badge since ProgressMap is `md:flex`. Easy to fix with a small bottom-left fixed pill that reads from `useActiveSceneId()`. |
| **Code quality** (10) | **8 / 10** | New `lib/useActiveSection.ts` is correct and idiomatic: module-singleton IO with `useSyncExternalStore`, lazy start with rAF retry if `<section>`s haven't mounted yet, clean teardown when the listener set empties. Solves Phase D NB4 (scene order coupling) by introducing a `SceneId`-keyed lookup helper `useActiveSceneId()`. Removed the `window.__SPARK_SCENE_COUNT__` window pollution (NB6 from Phase D, now gone in this codepath because `useActiveSection` doesn't need scene count outside of its `_listeners` set). **Minus 2**: (a) `SceneStage.tsx` now consumes BOTH `useScrollProgress()` (for camera lerp local) AND `useActiveSection()` (for scene selection) — two independent state sources whose disagreement is the source of B-E2; (b) `CameraRig` still drives off scroll-progress float through `activeScene(progress, SCENES.length)`. A cleaner factoring would be: have `useActiveSection` ALSO emit a `local` value (= the section's own scroll-into-viewport ratio) and have CameraRig consume the same source-of-truth so scene-render and scene-camera are guaranteed to agree. |
| **Audio polish** (5) | **5 / 5** | Off by default ✓, lazy Tone.js ✓, `AMBIENT_NOTES[sceneIndex]` ambient pad (unchanged from Phase D — pad still ramps to gain 0.18 over 2.5 s on enable), `playCue` catches log `console.debug` only in dev. The SceneCueDriver now reads from `useActiveSection`, so the per-scene chord transitions trigger on viewport-driven scene change rather than float-progress boundaries — this is correct. |
| **Visual polish** (5) | **5 / 5** | Production typography continues to be the highlight. Bloom is visible (still `luminanceThreshold={0.18}`) on the shuffle and airflow scenes. Partition shatter, narrow-vs-wide grids, airflow clock dial, ephemeral master+workers, fly cubes all read clearly. ClusterIdle hero now wakes up with scroll. Sandpack theme stays sRGB hex. ProgressMap dots remain legible at rest. Even the empty scene-2 canvas isn't visually ugly — it's just unsatisfying. |
| **Mobile** (5) | **5 / 5** | `mobile-0.png` (375 × 812): full H1, body, dedication, and a small ClusterIdle cube cluster peeking from below. `mobile-33.png`: data-arrival prism cropped at left but plainly visible. `mobile-50.png`: large orange driver cube + scatter of blue task balls — **B-D3 resolved**. `mobile-75.png`: stages diagram (blue + orange + blue boxes). Alignment matrix above confirms mostVis ↔ closest H2 ↔ kicker agree on mobile too. The `zScale=1.45 yScale=1.15` pullback when `size.width < 640` does its job. Mobile gets no ProgressMap pill (still md:flex only) but that's the long-running NB5 not a Phase E regression. |
| **TOTAL** | **86 / 100** | |

---

## Blocking issues — must fix before phase advance

### B-E1. Dev server hydration crash on first scroll: `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass` / `setRenderer`
**Files:** `components/three/SceneStage.tsx:73` (the `<Canvas>` JSX); the crash originates from `node_modules/postprocessing/build/index.js:1320` and `:1158`; `EffectComposer` constructor + `addPass` reads `renderer.getContext().getContextAttributes().alpha`.

**Reproduces:**
1. Open `http://localhost:3737/spark` in any browser. Article renders cleanly for ~500 ms (verified — `_dom.json` from the v2 run shows `h1="Build a Spark cluster you can fly through."`, 12 sections, 1 canvas).
2. Scroll any amount.
3. Page enters an error state. Console logs `THREE.WebGLRenderer: Context Lost.`. Then a pageerror fires: `TypeError: Cannot read properties of null (reading 'alpha') at EffectComposer.addPass (...postprocessing.../index.js:1320:67)`. The Next.js dev runtime overlay replaces the entire body; subsequent DOM probes report `h1.text="This page couldn't load"` and 0 canvas / 0 sections.

**Evidence:**
- `docs/screenshots/phaseE-dev-crash/16.png` through `100.png` — all show the Next.js error card "Runtime TypeError: Cannot read properties of null (reading 'alpha')" pointing to `components/three/SceneStage.tsx (73:7)` with call stack `SceneStage` → `ClusterStageCanvas` → `SparkArticle`.
- `docs/screenshots/phaseE-dev-crash/_errors.txt` — 4 distinct page errors, each on a different scroll attempt.
- `docs/screenshots/phaseE-dev-crash/_console.json` — 2 `THREE.WebGLRenderer: Context Lost.` events, both preceding an error.
- `/tmp/spark-critic-devreload.mjs` confirms the cycle: initial mount succeeds (`h1` correct, 12 sections, 1 canvas, 0 errors), then `scrollTo({top: 5000})` is enough to trigger `h1 = "This page couldn't load"` and `canvas = false`.

**Does NOT reproduce on production build** (`npx next start -p 3738`). `docs/screenshots/phaseE-prod/_errors.txt` is empty across all 13 desktop + 4 mobile scroll samples + landing. **This is therefore a dev/HMR-only crash** — but it makes the page unusable in the exact environment specified by the instructions ("dev server FRESHLY restarted at http://localhost:3737").

**Likely root cause:** the SceneStage component re-renders on scroll (because `useScrollProgress` returns a fresh number every frame OR because the `useActiveSection`-driven scene index changes), the Canvas/r3f tries to recreate or reuse the GL context; during the transition `renderer.getContext()` returns null, and `EffectComposer.setRenderer` / `addPass` dereferences `getContextAttributes().alpha` without a null-guard. Two fix directions:
- (a) Memoise the `EffectComposer` children or wrap the entire `<EffectComposer>` block in a `<Suspense>` boundary that survives Canvas remount.
- (b) Don't recreate the EffectComposer on scene change — extract scene-dependent params (bloom intensity) into a separate component inside the composer rather than reading them at composer construction time. `SceneStage.tsx:50-55` reads `bloomIntensity` from the active `index`, which changes every time `useActiveSection()` fires; React then rebuilds the EffectComposer subtree, which calls `setRenderer` on a stale/lost renderer.

This is the single biggest reason the score dropped from "could pass" to a hard fail in dev.

### B-E2. Anatomy scene canvas still empty at scroll 16 % — camera lerp vs IO scene-selection disagreement
**Files:** `components/three/SceneStage.tsx:42-46` (scene index from `useActiveSection`), `components/scroll/CameraRig.tsx:46-72` (camera lerp from `activeScene(progress, SCENES.length)` — float progress, not IO).

The Phase E worker fix made scene SELECTION use IntersectionObserver (`useActiveSection`), but CameraRig STILL drives camera position from the scroll-progress float (`activeScene(progress, SCENES.length)`). When the user is in the middle of the anatomy section (scroll 16 %, scrollY 2937, anatomy section spans 2192..3812, mid-section ratio 0.46), IO correctly says "anatomy" and renders the WorkerCutaway. But `activeScene(0.16, 12)` returns `idx=1, local=0.92` — i.e. the rig is 92 % of the way along the anatomy→driver waypoint interpolation. Camera position lerps to `mix(anatomyWaypoint, driverWaypoint, 0.92)` ≈ `[5.0+0.92*(1.4-5.0), 1.5+0.92*(0.9-1.5), 4.2+0.92*(2.6-4.2)] = [1.7, 1.0, 2.7]`, looking near origin. The worker cube at `[3.2, 0, 0]` is now well off-screen to the right.

`docs/screenshots/phaseE/16.png` confirms: starfield only, no geometry.

The same disagreement happens at every scroll where the scrollY-into-section ratio doesn't match the float-progress fraction-of-12. Scenes 4 (data-arrival, 33 %) and 7 (narrow-vs-wide, 58 %) are visible because their geometry is wider / closer to origin and stays inside the frustum across the lerp; scene 2 is uniquely fragile because the worker cube sits at x=3.2 (off-centre by 3+ units) and any camera drift toward the origin loses it.

**Fix direction:** unify the source-of-truth. Either:
- (a) Have `useActiveSection` also emit `local` (the section's own progress, e.g. `(scrollY - section.top) / section.height`) and route CameraRig through it instead of `activeScene(progress, SCENES.length)`. Then camera and scene-render share one mapping.
- (b) Have `CameraRig` look up the active scene via `useActiveSection()` and only use float-progress for *within-section* easing.
- (c) Cheap hack: hard-snap the camera to the active scene's waypoint when scenes change (lerp factor=1 for one frame), so even when float-progress is at a boundary, the camera at least visits each waypoint.

### B-E3. ShuffleScene executor cubes occluded by LiveSandpack iframe (NB8 from Phase D — still open)
**Files:** `components/three/scenes/ShuffleScene.tsx`, `components/code/LiveSandpack.tsx`.

`docs/screenshots/phaseE/66.png` shows the iframe covering ~50 % of the canvas in the shuffle scene. The shuffle arcs and executor labels A / B are partially behind the code editor. Either move the editor to a `md:` side panel for `lg:` viewports, push the ShuffleGroup down 1.5 world units when scene 8 is active, or shrink the editor to 40 % width. Not blocking on its own but the centerpiece scene deserves an unobstructed read at the canonical scoring scroll.

---

## Phase D blockers — resolution status

| ID | Phase D blocker | Phase E status | Evidence |
|---|---|---|---|
| **B-D1** | Prose ↔ kicker ↔ 3D systematically out of sync at scrolls 25/42/50/75 due to `activeScene()` dividing scrollHeight by 12 ignoring header offset | **RESOLVED** | Alignment matrix above. Every desktop scroll: `mostVisibleSection` ↔ `closest H2 sceneId` ↔ `activeKicker` agree. New `useActiveSection` (IntersectionObserver) is the single source of truth for ProgressMap, ExplainerSidebar, SceneCueDriver, and SceneStage scene selection. Mobile alignment matrix also agrees at every scroll. |
| **B-D2** | Canvas empty (starfield only) at scrolls 16 % (scene 2), 25 % (scene 4), 83 % (scene 11) due to camera waypoints framing empty space | **PARTIALLY RESOLVED** | Scene 4 (data prism at scroll 33 % — its IO-selected scroll) now visible. Scene 11 ephemeral cluster at scroll 92 % (its IO-selected scroll) visible from start thanks to `EphemeralCycle` baseline `0.4` scale. **BUT scene 2 (anatomy) at scroll 16 % is still empty** — see B-E2. The worker fix corrected the waypoint coords but didn't address the IO-vs-float-progress disagreement that pushes the camera past the waypoint at canonical scroll positions. |
| **B-D3** | Mobile mid-scroll viewport empty — desktop waypoints didn't account for 375-px width | **RESOLVED** | `mobile-0.png`, `mobile-33.png`, `mobile-50.png`, `mobile-75.png` all show 3D geometry filling a portion of the viewport. `CameraRig` applies `zScale=1.45 yScale=1.15` when `size.width < 640` (verified in `CameraRig.tsx:57-60`). |

---

## Non-blocking issues (Phase E)

### NB-E1. Two independent state sources for "active scene" in SceneStage
`SceneStage.tsx:41-46` consumes `useScrollProgress()` AND `useActiveSection()`. The scene index comes from IO, the local-progress (for `progress` prop into each scene component, used for inner animations) comes from float. They mostly agree but can disagree by one frame during section transitions, causing brief mis-frames during fast scroll.

### NB-E2. Scene 12 finale still under-delivers (Phase C NB2, Phase D NB2 — unchanged)
`100.png` shows the same five cubes as the hero with the end-of-article footer text. Visual novelty for the payoff scroll would help: a different camera path, a star-field swoop, or the cubes auto-orbiting before the user takes control.

### NB-E3. Mobile still has no scene-of-12 kicker (Phase B S8, Phase D NB5 — unchanged)
ProgressMap is `md:flex`. Add a small fixed bottom-left scene-kicker pill on `< md` that reads from `useActiveSceneId()`.

### NB-E4. `THREE.Clock` deprecation warning (upstream — Phase A NB1, every phase since)
Single warning from r3f. Still not actionable in this repo.

### NB-E5. `npm start` hardcodes port 3737 — can't run dev and prod simultaneously
`package.json` `"start": "next start -p 3737"`. Honour `PORT` env var: `"start": "next start -p ${PORT:-3737}"` (or use a small wrapper). I had to bypass this with `npx next start -p 3738` to A/B test prod vs dev.

### NB-E6. `useActiveSection.ts` IntersectionObserver re-fires only on threshold crossings
Thresholds `[0, 0.25, 0.5, 0.75, 1]`. At rest the IO doesn't fire — fine. But during the gap between two threshold crossings (e.g., the section is at 0.30 intersection ratio, slowly approaching 0.50), the `_listeners` aren't notified. For a slow-scroll user this means the kicker can lag the prose by up to ~25 % of a section. Tighter threshold grid (`Array.from({length:21}, (_,i)=>i/20)`) would smooth this without measurable cost.

### NB-E7. Same Phase D NB7 (filename leading-underscore on `_StubCanvas`) — unchanged
File still imported by `ClusterStageCanvas`. Rename to `ReducedMotionStage.tsx` for clarity.

### NB-E8. ScrollHeight changed 20336 → 20156 px between Phase D and Phase E
Minor — likely a small layout change in `EphemeralCycle` or `SceneSection`. Not a defect, but worth noting because it shifts every absolute pixel referenced in older reports.

### NB-E9. The Phase D NB9 / NB10 / NB11 list is largely retired
NB10 (CodeMorph competes with 3D at scroll 83 %) is no longer applicable — at scroll 83 % the IO correctly selects airflow, the AirflowDag scene renders fully, and the CodeMorph card sits inside its own section without floating in starfield (`83.png`). NB11 (clock dial half-cropped at scroll 75) — at scroll 75 % the canvas now shows the stages diagram (per IO), not the airflow scene, so the clock framing concern at this scroll is moot; the clock at scroll 83 % is fully visible in `83.png` (top-left corner).

---

## Phase A B1-B6 confirmation matrix

| ID | Phase A finding | Phase E status | Evidence |
|---|---|---|---|
| **B1** | Double `.scene-canvas` sticky siblings | **STILL FIXED** | `_dom.json`: 1 `.scene-canvas` node, 1 canvas |
| **B2** | Canvas wrapper `-z-10` against opaque bg | **STILL FIXED** | Canvas at z-index 0, article at z-index 10; visible content at every prod screenshot |
| **B3** | `THREE.Color("oklch(...)")` defaulting to white | **STILL FIXED** | Zero OKLCH warnings in prod console |
| **B4** | Four independent `useScrollProgress` rAFs | **STILL FIXED** | Single module-level rAF in `useScrollProgress.ts`; new `useActiveSection` uses IO not rAF |
| **B5** | Header below the fold | **STILL FIXED** | `h1.y = 168` |
| **B6** | Shuffle unscorable | **STILL FIXED** | `66.png` shows the centerpiece moment |

## Phase B S1-S8 confirmation matrix

| ID | Phase B finding | Phase E status |
|---|---|---|
| **S1** Shuffle dots invisibly small | FIXED |
| **S2** NarrowVsWide + Shuffle overlap | FIXED (single-index collapse from Phase C, preserved) |
| **S3** Stages + Airflow simultaneous render | FIXED |
| **S4** Bloom + readPixels GPU stalls | FIXED in prod; the new dev crash B-E1 is a *different* root cause |
| **S5** Bloom barely visible | FIXED |
| **S6** Sandpack failed request | FIXED (no `ERR_ABORTED` in prod console) |
| **S7** Sandpack OKLCH theme | FIXED |
| **S8** Mobile mid-scroll dead air | **NOW FIXED** (B-D3 = Phase B S8 finally resolved by `zScale=1.45 yScale=1.15`) |

---

## What works (credit where due)

- The `lib/useActiveSection.ts` IntersectionObserver pattern is the right factoring. The alignment matrix is *perfect* at every desktop and mobile scroll — this is the cleanest the page has read since Phase B.
- The mobile pullback (`zScale=1.45 yScale=1.15`) decisively fixes Phase B S8 / Phase D B-D3 — `mobile-50.png` shows the orange driver cube + blue task balls in the middle of the 375 × 812 viewport.
- `EphemeralCycle` baseline scale 0.4 means the cluster is on-screen at scene start (`92.png`).
- The build remains clean, lint remains clean.
- The shuffle at scroll 66 % is now the centerpiece moment the brief asks for: oblique angle, executor labels A / B (drei `<Text>`), arcs with bloom, code editor overlay showing the partitioner — this is a polished editorial beat.
- Production console is *silent* of pageerrors across 17 scroll samples + landing.

## What to fix first

1. **B-E1** — diagnose the dev-server `EffectComposer` null-alpha crash. Likely fix: don't read scene-dependent values (`bloomIntensity`, `index === 11` for `isFly`) inside the `<Canvas>` JSX at the top of `SceneStage`, because every `useActiveSection` change re-renders SceneStage, which destroys and rebuilds the EffectComposer. Push those reads into a child component that lives *inside* the Canvas tree and reads `useActiveSection` from there, so the composer itself only mounts once.
2. **B-E2** — unify camera-lerp and scene-selection on the same source-of-truth (IO-based section progress). The cleanest fix is to extend `useActiveSection` to also emit the section's own scroll-into-viewport ratio, and have `CameraRig` consume both `sceneIndex` and `local` from there.
3. **B-E3** — move LiveSandpack to a side panel on `lg:` viewports or push the shuffle group down 1.5 units when scene 8 is active so the code editor and arcs don't fight for the centre of the canvas.

---

## Files referenced

- `lib/useActiveSection.ts` — NEW IntersectionObserver source-of-truth (78 LOC); module-singleton IO + `useSyncExternalStore`; exposes `useActiveSection()`, `useActiveSceneId()`, `readActiveSection()`
- `components/three/SceneStage.tsx:40-93` — consumes `useScrollProgress()` AND `useActiveSection()`; reads `bloomIntensity` based on active index at render time (suspected B-E1 trigger)
- `components/scroll/CameraRig.tsx:14-40` — 12 waypoints, scene 2/4/11 rewritten this phase
- `components/scroll/CameraRig.tsx:57-60` — mobile pullback `zScale=1.45 yScale=1.15`
- `components/three/scenes/EphemeralCycle.tsx:24` — `baseScale = 0.4 + spawn * 0.6`
- `components/scroll/SceneSection.tsx:14-15` — `data-scene-id` and `data-scene-index` on each section (consumed by `useActiveSection`)
- `lib/useScrollProgress.ts` — still drives float-progress to CameraRig
- `lib/scenes.ts` — unchanged

---

## Evidence artefacts

- `docs/screenshots/phaseE/landing.png` — landing page, unchanged from Phase D
- `docs/screenshots/phaseE/0.png` — hero, ClusterIdle cluster
- `docs/screenshots/phaseE/8.png` — hero/anatomy boundary, prose "A cluster, asleep." + cubes
- `docs/screenshots/phaseE/16.png` — **anatomy prose + kicker, canvas empty** (B-E2)
- `docs/screenshots/phaseE/25.png` — driver cube fully framed
- `docs/screenshots/phaseE/33.png` — data prism visible (left)
- `docs/screenshots/phaseE/42.png` — partition shatter (~60 cubes)
- `docs/screenshots/phaseE/50.png` — task rain (orange driver + blue balls)
- `docs/screenshots/phaseE/58.png` — narrow vs wide (green + blue cube grids)
- `docs/screenshots/phaseE/66.png` — shuffle centerpiece + A/B labels + Sandpack
- `docs/screenshots/phaseE/75.png` — stages diagram (blue + orange boxes)
- `docs/screenshots/phaseE/83.png` — airflow DAG + clock dial + CodeMorph
- `docs/screenshots/phaseE/92.png` — ephemeral cluster master+4 workers (visible from start)
- `docs/screenshots/phaseE/100.png` — fly cubes + end-of-article footer
- `docs/screenshots/phaseE/mobile-0.png`, `mobile-33.png`, `mobile-50.png`, `mobile-75.png` — mobile prod screenshots, all with 3D geometry
- `docs/screenshots/phaseE/_console.json` — prod console (3 warnings, 0 errors)
- `docs/screenshots/phaseE/_errors.txt` — prod page errors (0)
- `docs/screenshots/phaseE/_dom.json` — prod DOM probe + per-scroll scene-state records
- `docs/screenshots/phaseE/_mobile_state.json` — prod mobile per-scroll scene-state records
- `docs/screenshots/phaseE-dev-crash/` — companion dev-server crash evidence (every screenshot from scroll 8 % onward shows the Next.js error overlay)
- `docs/screenshots/phaseE-dev-crash/_errors.txt` — 4 distinct `EffectComposer.addPass` / `setRenderer` alpha-null errors

---

**Verdict: FAIL — 86 / 100. Phase advance blocked. The Phase D blockers B-D1 (alignment) and B-D3 (mobile mid-scroll) are decisively resolved by the new `useActiveSection` IntersectionObserver and the mobile camera pullback. B-D2 (empty canvas) is only partially resolved — scene 2 at scroll 16 % is still empty because the worker fix changed scene selection to IO but left CameraRig on float-based progress, so the camera lerp now overshoots the waypoint of scenes whose IO-active and float-active ranges don't align. New Phase E regressions: B-E1 dev-server `EffectComposer` null-alpha crash that hides the page from scroll-8 % onward in the exact environment specified by the brief; B-E2 (the camera-vs-IO disagreement above); B-E3 (Sandpack still occludes the shuffle centerpiece). Top 3 remaining issues: B-E1 (dev crash blocks the prototype in dev mode), B-E2 (one scene's content missing at its canonical scroll), B-E3 (Sandpack overlap with the centerpiece scene).**
