# Critic report — phase F, iteration 1

- **Date:** 2026-05-17
- **Phases under review:** Phase E fixes — `SceneStage` no longer reads scene-dependent `bloomIntensity` (now static 0.85), introduces `SceneFrame` that consumes `readActiveSectionLocal()` inside `useFrame` so `SceneStage` no longer re-renders per frame; Canvas configs (`CAMERA_CONFIG`, `DPR_CONFIG`, `GL_CONFIG`) hoisted to module scope; `CameraRig` now reads `readActiveSection()` + `readActiveSectionLocal()` directly inside its own `useFrame`; `LiveSandpack` collapsed-by-default with a "▷ try the shuffle key live" button; new `MobileKicker` fixed top-left badge for `<md` viewports.
- **Dev server:** `http://localhost:3737` (the freshly-restarted instance the brief specified — PID 50189, started 8:38 AM, source files modified same minute). Also exercised against a fresh **production** build on port 3738 (`npx next start -p 3738`) so I could distinguish the dev-only crash from the underlying scene-framing question that B-E2 raises.
- **Verdict:** **FAIL** — total **80 / 100** (need ≥95)
- **Screenshots (DEV server — the canonical target this phase):** `docs/screenshots/phaseF/{0,8,16,25,33,42,50,58,66,75,83,92,100,landing,mobile-0,mobile-33,mobile-50,mobile-75}.png`, `_console.json`, `_errors.txt`, `_dom.json`, `_mobile_state.json`.
- **Production reference build:** `docs/screenshots/phaseF/{0,8,16,25,33,42,50,58,66,75,83,92,100}-prod.png`, `mobile-{0,33,50,75}-prod.png`, `_console-prod.json`, `_errors-prod.txt`, `_dom-prod.json`, `_mobile_state-prod.json`.
- **Tool note:** Cached Playwright Chromium at `~/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`. Harnesses: `/tmp/spark-critic-phaseF.mjs` (DEV /spark suite + landing + mobile + post-scroll stress check), `/tmp/spark-critic-phaseF-prod.mjs` (PROD /spark suite on port 3738 to confirm prod path).
- **Headline:** **B-E1 (dev crash on first scroll) is NOT resolved.** Despite the static-bloom + SceneFrame + hoisted-config refactor, the exact same `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass` still fires on the first scroll. **B-E3 (Sandpack occlusion) IS resolved** by the collapsed-by-default editor. **B-E2 (scene 2 anatomy canvas empty) is NOT resolved** — even in the clean prod build, scrolling to 16 % still renders only the starfield for the anatomy section.

---

## Executive summary

The Phase E worker landed two concrete code changes between iterations:

1. **`SceneStage.tsx`** — hoisted `CAMERA_CONFIG`, `DPR_CONFIG`, `GL_CONFIG` to module scope, removed `useLocalProgress` polling, and introduced a `SceneFrame` child component that reads `readActiveSectionLocal()` inside `useFrame` and only `setProgress`-es every 40 ms or on > 0.05 jump. The intent was to stop SceneStage from re-rendering per frame so `<EffectComposer>` would never be torn down and rebuilt by React.
2. **`LiveSandpack.tsx`** — collapsed-by-default with an inline `▷ try the shuffle key live` button; opens to the full Sandpack on click.

The Sandpack change is a clear visual win. The SceneStage refactor is correct in spirit but **does not address the actual crash trigger** — which the Phase E report misidentified. The crash is preceded by `THREE.WebGLRenderer: Context Lost.` (a real WebGL event the browser fires when the dev server's HMR rebuild trims a chunk that referenced the live context), and then **on the next React reconciliation** the existing `EffectComposer` ref calls `setRenderer(renderer)` → `addPass()` → `getContextAttributes().alpha` on a renderer whose internal context has just gone null. SceneFrame doesn't help because the renderer disposal happens in r3f-internal code paths that fire on Fast Refresh, not on `index` change.

Empirical evidence: the test harness records `[Fast Refresh] rebuilding` immediately followed by `THREE.WebGLRenderer: Context Lost.` immediately followed by the alpha-null TypeError, and the Next.js dev runtime overlay (visible at every scroll from 16 % onward in `docs/screenshots/phaseF/{16,25,...,100}.png`) replaces the body. The DOM probe at scroll 16 % returns `bodyH1 = "This page couldn't load"`, `canvasCount = 0`, `sectionsCount = 0` — identical to the Phase E dev evidence. **Scroll 0 and scroll 8 render fine** (`canvasCount = 1, sectionsCount = 12, bodyH1 = "Build a Spark cluster you can fly through."`), confirming the crash happens at or just before scroll 16 %, exactly as in Phase E.

For B-E2 I built a fresh production binary (`npm run build` clean, `npx next start -p 3738`) and re-ran the full screenshot suite. At scroll 16 % the prod canvas is **still empty starfield** — see `docs/screenshots/phaseF/16-prod.png`. The new commit b907cfa (which moved `CameraRig` to read `readActiveSection()`+`readActiveSectionLocal()` inside `useFrame`) shares the source-of-truth as the report demanded, but the camera still lerps from waypoint[anatomy] toward waypoint[driver] using the section-local progress, and at scrollY = 2937 / scrollHeight = 17656 px (the canonical 16 %) the section-local progress is ~0.65 — putting the camera 72 % of the way through the lerp (`smoothstep(0.65) ≈ 0.722`). With waypoint[1] = pos:[5.0, 1.5, 4.2] look:[3.2, 0, 0] and waypoint[2] = pos:[1.4, 0.9, 2.6] look:[0, 0, 0], the rig ends up at pos≈[2.4, 1.07, 3.04] look≈[0.89, 0, 0], and the worker cube at [3.2, 0, 0] sits ~40° off-axis (fov is 38°, half-fov 19°). Same phenomenon the Phase E report described: the waypoint frames the cube at local=0, but by local≈0.65 the camera has already left, and 16 % of total scroll happens to land at local≈0.65 of section 2. The fix the previous critic suggested — anchor each scene at its own waypoint and only lerp out late (or use `index`'s waypoint as the home, with `local` only modulating the look-vector) — was not applied.

The Sandpack collapse fix is decisive: `docs/screenshots/phaseF/66-prod.png` shows the shuffle scene with executor cubes A, B, C, D, arc rows, and the prose card on the left — and crucially, **no Sandpack iframe**. The collapsed `▷ try the shuffle key live` button is the only Sandpack-related UI present (the prod DOM probe shows `sandpackVisible: false, sandpackCollapsedBtnPresent: true` at every desktop and mobile scroll). The shuffle now reads as the centerpiece editorial beat the brief asks for, unobstructed.

The new `MobileKicker` (commit f17c7dc) addresses the long-running NB5 from Phase B/D/E — the fixed top-left scene-of-12 pill appears on `<md` viewports (visible in `docs/screenshots/phaseF/mobile-50-prod.png` as the orange `06 · PARALLELISM` badge), giving mobile users the per-scene context they'd been missing.

---

## DOM probe — dev server, scroll 0 (the only scroll where the page is alive)

From `docs/screenshots/phaseF/_dom.json`:

| Probe | Value | Interpretation |
|---|---|---|
| `h1.text` | `"Build a Spark cluster you can fly through."` | Real H1 (page is alive at scroll 0) |
| `h1Y` | 168 px | H1 well within viewport ✓ |
| `scrollHeight` | 19256 px | (Phase E was 20156; layout further compressed by the new `MobileKicker` not affecting desktop, possibly by SceneFrame removing `useState` re-render churn — minor) |
| `canvasCount` | 1 | Single canvas ✓ |
| `sectionsCount` | 12 | All scenes mounted ✓ |

### Alignment matrix — PROD reference build (canonical, since dev crashes)

From `docs/screenshots/phaseF/_dom-prod.json` → `sceneStateRecords`:

| scroll % | scrollY | mostVisibleSection (id#index) | closest H2 sceneId | kicker | kickerIdx | aligned? | sandpackVisible | btnPresent |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 | hero#1 | (none above 0) | `01 · The cluster` | 1 | ✓ | false | ✓ |
| 8 | 1402 | hero#1 | hero | `01 · The cluster` | 1 | ✓ | false | ✓ |
| 16 | 2803 | anatomy#2 | anatomy | `02 · Anatomy` | 2 | ✓ | false | ✓ |
| 25 | 4380 | driver#3 | driver | `03 · The driver` | 3 | ✓ | false | ✓ |
| 33 | 5781 | data-arrival#4 | data-arrival | `04 · The data` | 4 | ✓ | false | ✓ |
| 42 | 7358 | partitions#5 | partitions | `05 · Partitions` | 5 | ✓ | false | ✓ |
| 50 | 8759 | task-rain#6 | task-rain | `06 · Parallelism` | 6 | ✓ | false | ✓ |
| 58 | 10160 | narrow-vs-wide#7 | narrow-vs-wide | `07 · Transformations` | 7 | ✓ | false | ✓ |
| 66 | 11561 | shuffle#8 | shuffle | `08 · The shuffle` | 8 | ✓ | **false** | **✓** |
| 75 | 13138 | stages#9 | stages | `09 · Stages` | 9 | ✓ | false | ✓ |
| 83 | 14539 | airflow#10 | airflow | `10 · Orchestration` | 10 | ✓ | false | ✓ |
| 92 | 16116 | ephemeral#11 | ephemeral | `11 · Ephemeral clusters` | 11 | ✓ | false | ✓ |
| 100 | 17517 | fly#12 | fly | `12 · Fly mode` | 12 | ✓ | false | ✓ |

**Every row aligns. Sandpack collapsed at scroll 66 (and every other scroll) — B-E3 is decisively fixed.**

### Mobile alignment matrix — PROD (375 × 812)

| scroll % | scrollY | mostVisibleSection | closest H2 sceneId | kicker | aligned? |
|---|---|---|---|---|---|
| 0  | 0     | hero#1         | hero (or none)    | `01 · The cluster` | ✓ |
| 33 | 5246  | data-arrival#4 | data-arrival      | `04 · The data` | ✓ |
| 50 | 7949  | task-rain#6    | task-rain         | `06 · Parallelism` | ✓ |
| 75 | 11924 | stages#9       | stages            | `09 · Stages` | ✓ |

Mobile alignment mirrors desktop exactly. `mobile-50-prod.png` shows the new `MobileKicker` top-left pill (`06 · PARALLELISM`) plus the orange driver cube and blue task balls — both B-D3 confirmation and NB5 resolution in the same frame.

### Dev-server scene-state records (for completeness — they all show "This page couldn't load")

From `docs/screenshots/phaseF/_dom.json` → `sceneStateRecords`:

| label | scrollY | bodyH1 | canvasCount | sectionsCount |
|---|---|---|---|---|
| desktop-0 | 0 | `Build a Spark cluster…` | 1 | 12 |
| desktop-8 | 1468 | `Build a Spark cluster…` | 1 | 12 |
| desktop-16 | 2937 | **`This page couldn't load`** | **0** | **0** |
| desktop-25..desktop-100 | — | **`This page couldn't load`** | **0** | **0** |
| post-stress (scrollTo bottom) | — | **`This page couldn't load`** | **0** | **0** |

`docs/screenshots/phaseF/_errors.txt` — **4 distinct `EffectComposer.addPass` alpha-null TypeErrors** (one per page reload that the harness implicitly issued via `page.goto` between landing / desktop / mobile contexts). Identical signature, identical stack trace, identical line in `node_modules/postprocessing/build/index.js:1320`. **Zero pageerrors in production** (`docs/screenshots/phaseF/_errors-prod.txt` is empty across 17 scroll samples × 2 viewports).

---

## Rubric

| Category | Score | Reasoning |
|---|---|---|
| **Build & lint clean** (15) | **15 / 15** | `npm run build` succeeds (Turbopack, 3.5 s, 4 routes); `npm run lint` (`tsc --noEmit`) is clean. No TypeScript errors. |
| **No console errors** (10) | **2 / 10** | **PROD:** zero pageerrors across 13 desktop + 4 mobile scrolls + landing; only the upstream `THREE.Clock: This module has been deprecated` warning and Chromium font-subsystem `unsupported GPOS/GSUB table LookupType` debug noise (unchanged). **DEV:** 4 distinct `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass (postprocessing/build/index.js:1320:67)` — exactly the Phase E crash, exactly the same call stack. The dev runtime overlay (`Runtime TypeError` shown in `docs/screenshots/phaseF/{16..100}.png`) replaces the entire DOM from scroll 8 % onward. Preceded by `THREE.WebGLRenderer: Context Lost.` and `[Fast Refresh] rebuilding` console events — the trigger is HMR re-evaluating the SceneStage module, not the `bloomIntensity` value as the previous fix assumed. **The brief's pass criterion ("Verify dev does not crash on scroll") is unmet.** −8. |
| **Scene completeness** (15) | **10 / 15** | All 12 sections render in prod with full prose ↔ kicker ↔ canvas alignment. Scenes 1 (hero / ClusterIdle), 3 (driver — orange cube + halo), 4 (data prism), 5 (partitions shatter ≈ 60 cubes), 6 (parallelism — orange driver + blue tasks), 7 (narrow-vs-wide — green + blue grids), 8 (**shuffle, centerpiece, no occlusion**), 9 (stages — blue-orange-blue islands), 10 (airflow + clock dial + CodeMorph), 11 (ephemeral master+4 workers visible from start), 12 (fly cubes + end-of-article footer) read cleanly. **Scene 2 (anatomy) is still empty starfield at scroll 16 % in PROD** (`docs/screenshots/phaseF/16-prod.png`). Same B-D2/B-E2 phenomenon, same cause: at scroll 16 % the section-local progress is ≈ 0.65, the camera is 72 % through the anatomy→driver lerp, and the worker cube at `[3.2, 0, 0]` falls just outside the 38°-fov frustum. The previous critic's recommended fix (anchor on the active waypoint and only lerp out late) was not applied. **Minus 5** for one full scene's content missing at its canonical scoring scroll (the dev crash is scored separately above). |
| **The Shuffle** (15) | **15 / 15** | `docs/screenshots/phaseF/66-prod.png` — the shuffle is now the unobstructed centerpiece. Oblique camera angle, executor cubes labeled `A`, `B`, `C`, `D` (drei `<Text>` glyphs visible), arc rows of partition spheres connecting them, prose card "The shuffle." on the left, and the collapsed `▷ try the shuffle key live` button at the bottom-left of the prose. The Sandpack iframe is gone from the centerpiece view; one click reveals the editor on demand. This is exactly what the brief asks for. |
| **Performance** (10) | **8 / 10** | Single rAF in `lib/useScrollProgress.ts`; single IntersectionObserver in `lib/useActiveSection.ts` (12 sections × 5 thresholds, very cheap); `SceneFrame` now batches `setProgress` to every 40 ms / 0.05 jump rather than per frame — a real improvement. `EffectComposer multisampling={0}` still in place; no readPixels stalls in prod. **Minus 2**: the `THREE.WebGLRenderer: Context Lost.` event still fires once per page lifetime, which in prod is recoverable but in dev cascades into the alpha-null crash. The root cause appears to be HMR re-evaluation discarding the `WebGLRenderer` instance while keeping the `EffectComposer` ref alive. A Suspense boundary around `<EffectComposer>`, or detaching the composer in a `useEffect` cleanup, would close this. |
| **Accessibility** (10) | **10 / 10** | Skip-link, `role="main"`, AudioToggle ARIA, `<nav aria-label>` on ProgressMap, `aria-current="true"` on the active scene pill (verified `kickerVsMostVisAligned: true` at every prod scroll desktop + mobile), ExplainerSidebar dialog semantics + Esc + focus return, `<canvas aria-hidden>`, reduced-motion fallback. **NB5 from Phase B/D/E is now resolved** — `MobileKicker.tsx` adds a fixed top-left scene-of-12 pill on `<md` viewports that reads from `useActiveSceneId()`, so mobile screen-reader users now hear the same scene context as desktop. Full marks. |
| **Code quality** (10) | **7 / 10** | New `components/three/SceneFrame.tsx` is a sensible factoring — `useFrame`-driven local progress with a coarse `setProgress` schedule prevents the per-frame React re-render that was identified as a suspect. `CAMERA_CONFIG`/`DPR_CONFIG`/`GL_CONFIG` hoisted to module scope avoids object-identity churn. `LiveSandpack.tsx` collapsed-by-default with `aria-expanded`/`aria-controls` is clean. **Minus 3**: (a) the fix doesn't actually solve the dev crash because the crash trigger is HMR-driven `WebGLRenderer.dispose()`, not React-driven SceneStage re-renders — the worker accepted the previous critic's hypothesis without testing it; (b) the duplication of source-of-truth pointed out in NB-E1 has been partially addressed by CameraRig reading `readActiveSection()` directly, but `SceneFrame` still uses `setState` to push progress to scene components, leaving a small async gap between the rAF-driven camera and the React-driven scenes (~40 ms); (c) the waypoint-lerp problem remains: the camera should clamp toward the *current* waypoint while the IO says the section is active, not blend through to the next. |
| **Audio polish** (5) | **5 / 5** | Off by default, lazy Tone.js, `AMBIENT_NOTES[sceneIndex]` pad ramps to gain 0.18 over 2.5 s on enable, `playCue` errors logged `console.debug` only in dev. SceneCueDriver reads from `useActiveSection`, so per-scene chord transitions are tied to viewport-active scene. Unchanged from Phase E. |
| **Visual polish** (5) | **5 / 5** | Prod typography continues to be the highlight. Bloom (`luminanceThreshold = 0.18`, intensity 0.85) reads on the shuffle, airflow, and driver-halo scenes. Partition shatter, narrow-vs-wide grids, stages diagram, airflow DAG + clock dial, ephemeral master+workers, fly cubes all read clearly in prod. Sandpack inline-button styling matches the rest of the chrome (mono, uppercase, tracked). |
| **Mobile** (5) | **3 / 5** | `mobile-0-prod.png`: full H1, body, dedication, ClusterIdle cluster peeking from below ✓. `mobile-33-prod.png`: data-arrival prism visible ✓. `mobile-50-prod.png`: orange driver cube + blue task balls + new `06 · PARALLELISM` MobileKicker top-left badge ✓ — B-D3 still resolved. `mobile-75-prod.png`: stages diagram ✓. Alignment matrix above confirms perfect mobile sync. **Minus 2**: same dev-only crash reproduces on mobile (375 × 812) viewport — `mobile-33.png`, `mobile-50.png`, `mobile-75.png` from the dev harness all show "This page couldn't load". Mobile users in dev see the same dead overlay as desktop users. |
| **TOTAL** | **80 / 100** | |

---

## Blocking issues — must fix before phase advance

### B-F1. Dev-server `EffectComposer.addPass` alpha-null crash still reproduces on first scroll (= B-E1, unresolved)
**Files:** `components/three/SceneStage.tsx:48` (the `<Canvas>` JSX); crash originates from `node_modules/postprocessing/build/index.js:1320:67` inside `EffectComposer.addPass` reading `getContextAttributes().alpha`.

**Reproduces:**
1. Open `http://localhost:3737/spark` in any browser. Article renders correctly for ~500 ms — verified in `docs/screenshots/phaseF/0.png` (correct H1, ClusterIdle hero cubes peeking, `01 · THE CLUSTER` kicker pill).
2. Scroll any amount. Console fires `[Fast Refresh] rebuilding`, then `[Fast Refresh] done in 138 ms`, then `THREE.WebGLRenderer: Context Lost.`, then `TypeError: Cannot read properties of null (reading 'alpha')`.
3. From scroll ~8 %–16 % onward, the Next.js dev runtime overlay replaces the DOM (`docs/screenshots/phaseF/16.png` through `100.png`). The overlay reports `components/three/SceneStage.tsx (48:7) @ SceneStage` — note the line moved from Phase E's `73:7` to F's `48:7` because the SceneStage.tsx file was rewritten by the worker, but the symbolic location (the `<Canvas>` JSX) is the same.

**Evidence:**
- `docs/screenshots/phaseF/_errors.txt` — 4 distinct page errors, all the same alpha-null TypeError.
- `docs/screenshots/phaseF/_console.json` — `THREE.WebGLRenderer: Context Lost.` immediately precedes each crash; preceded itself by `[Fast Refresh] rebuilding`.
- `docs/screenshots/phaseF/_dom.json` — `desktop-0` and `desktop-8` records show alive article (`canvasCount=1, sectionsCount=12, h1="Build a Spark cluster…"`); from `desktop-16` onward, `canvasCount=0, sectionsCount=0, h1="This page couldn't load"`.
- `docs/screenshots/phaseF/_mobile_state.json` — same on mobile.

**Does NOT reproduce on production build** (`npx next start -p 3738`): `docs/screenshots/phaseF/_errors-prod.txt` is empty across all 13 desktop + 4 mobile + 1 landing samples. The crash is dev-only — but it is *the* environment the brief specifies and the one a developer iterating on this article uses.

**Why the Phase E fix didn't work:** the worker accepted the previous critic's hypothesis that re-reading `bloomIntensity` on the `<EffectComposer>` JSX caused React to tear down and rebuild the composer. The static-bloom + SceneFrame refactor demonstrably reduces SceneStage re-renders per scroll-frame from ≈ 60 Hz to 1-per-scene-change, but the alpha-null still fires on the very *first* HMR Fast Refresh after page load. The real trigger is: Turbopack's HMR re-evaluates the `SceneStage.tsx` module, which discards the old `<Canvas>` and its `WebGLRenderer`; the `EffectComposer` instance (held inside `@react-three/postprocessing`'s internal r3f instance tree) re-attaches to the new renderer via `setRenderer()`/`addPass()`; at that exact moment `renderer.getContext()` returns null (the GL context was bound to the old, disposed canvas).

**Three fix directions, ordered by effort:**
- **(a) Cheap:** add a `key={index === 11 ? 'fly' : 'rails'}` to `<EffectComposer>` so it explicitly unmounts/remounts (currently `<EffectComposer>` is a singleton across renders and accumulates passes). Even simpler: wrap the composer in a `<Suspense fallback={null}>` boundary so HMR can re-establish it without racing.
- **(b) Correct:** move the entire `<EffectComposer>` subtree into its own `"use client"` component and dynamic-import it via `next/dynamic({ ssr: false })`. HMR will then HMR that module independently of SceneStage and the composer will recreate itself on the fresh renderer.
- **(c) Upstream:** patch `@react-three/postprocessing` (or use a `disabled` prop guard) to bail from `addPass` when `gl.getContext() == null` instead of dereferencing `.alpha` directly.

**Until B-F1 is fixed, the brief's primary verification fails ("Verify dev does not crash on scroll" — it does).**

### B-F2. Scene 2 (anatomy) canvas remains empty at scroll 16 % in PROD (= B-E2, unresolved)
**Files:** `components/scroll/CameraRig.tsx:30-56` (the `useFrame` that lerps `WAYPOINTS[index]` → `WAYPOINTS[index+1]` by section-local progress).

`docs/screenshots/phaseF/16-prod.png` shows only the starfield. The kicker reads `02 · ANATOMY`, the prose reads "Inside a worker.", and the canvas is empty.

At scroll 16 % (scrollY = 2803 of scrollHeight 17656 in prod), the anatomy section spans y = 2058 → 3678 (its top is 745 px above the viewport top). Section-local progress = `(viewportH - rect.top) / (rect.height + viewportH)` = `(900 - (-745)) / (1620 + 900)` = `1645 / 2520 = 0.653`. The smoothstep gives t = 0.722. Lerp from waypoint[1] (`pos:[5.0, 1.5, 4.2] look:[3.2, 0, 0]`) → waypoint[2] (`pos:[1.4, 0.9, 2.6] look:[0, 0, 0]`) by t=0.722 yields camera pos ≈ `[2.4, 1.07, 3.04]` look ≈ `[0.89, 0, 0]`. The worker cube at `[3.2, 0, 0]` is at vector `[0.8, -1.07, -3.04]` from the camera; the look direction is `[-1.51, -1.07, -3.04]`. Angle between them is ≈ 40°. The camera's fov is 38° (half-fov 19°), so the worker cube is ≈ 21° outside the frustum.

**Fix:** the lerp should anchor on the current waypoint while IO says the section is active, and only blend toward the next waypoint in the final ~15 % of the section. One-line change: `const t = Math.max(0, (local - 0.85) / 0.15);` then `smoothstep`. (Or even simpler: snap to `WAYPOINTS[index]` and reserve `local` for per-scene fine motions inside the scene component.) The Phase E recommendation was identical.

---

## Phase E blockers — resolution status

| ID | Phase E blocker | Phase F status | Evidence |
|---|---|---|---|
| **B-E1** | Dev server hydration crash on first scroll: `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass` | **NOT RESOLVED — same error, same location** | `docs/screenshots/phaseF/{16..100}.png` show the Next.js error overlay; `_errors.txt` has 4 identical alpha-null TypeErrors; the SceneFrame + static-bloom + module-scope-configs refactor addressed the wrong root cause (HMR module re-evaluation, not React re-render). **Persists as B-F1.** |
| **B-E2** | Scene 2 anatomy canvas empty at scroll 16 % due to camera lerp overshooting the waypoint | **NOT RESOLVED — even in prod build** | `docs/screenshots/phaseF/16-prod.png` shows starfield only. Commit b907cfa moved camera to IO-driven progress (the previous critic's recommended unification), but the lerp itself still blends through to the next waypoint by section-local≈0.65 at the canonical scroll. The waypoint-anchoring fix (clamp t until late in the section) was not applied. **Persists as B-F2.** |
| **B-E3** | Sandpack iframe occluding shuffle stage | **RESOLVED** | `docs/screenshots/phaseF/66-prod.png` shows the shuffle scene fully unobstructed: arc rows, A/B/C/D executor labels, prose card "The shuffle.", and only the collapsed `▷ try the shuffle key live` button at the bottom-left of the prose. Prod DOM probe confirms `sandpackVisible: false` and `sandpackCollapsedBtnPresent: true` at every scroll. |

---

## Phase D blockers — resolution status (re-confirmed)

| ID | Phase D blocker | Phase F status | Evidence |
|---|---|---|---|
| **B-D1** | Prose ↔ kicker ↔ 3D systematically out of sync at scrolls 25/42/50/75 | **STILL RESOLVED** | Prod alignment matrix above — every desktop and mobile scroll has `kickerVsMostVisAligned: true`. |
| **B-D2** | Canvas empty at scrolls 16 % (scene 2), 25 % (scene 4), 83 % (scene 11) | **PARTIALLY RESOLVED** (scenes 4, 11 fine; scene 2 still empty — persists as B-F2). |
| **B-D3** | Mobile mid-scroll viewport empty | **STILL RESOLVED** | `mobile-50-prod.png` shows orange driver cube + blue task balls + MobileKicker badge. |

---

## Non-blocking issues (Phase F)

### NB-F1. Mobile-50 prose card overlaps the orange driver cube in scene 6
At `mobile-50-prod.png` the prose card "Tasks, in parallel." sits over the driver cube. Readable, but visually noisy. Either reduce prose-card width on mobile or shift the cube cluster to the right of the viewport for `< 640` width. (The desktop frame is fine — cube clusters are off-centre and prose has a clear left column.)

### NB-F2. `SceneFrame` `setState` cadence introduces a ~40 ms async gap between camera and scene anims
`components/three/SceneFrame.tsx:31` only pushes `setProgress` every 40 ms or on > 0.05 jump. CameraRig reads `readActiveSectionLocal()` directly in its own `useFrame` (every frame). So during fast scroll the camera is ~2 frames ahead of the per-scene fade animations. Imperceptible on a stable scroll, but worth noting if scene-internal animations ever try to sync precisely with camera motion.

### NB-F3. `WebGLRenderer: Context Lost` still fires in prod (just doesn't crash)
`docs/screenshots/phaseF/_console-prod.json` contains one occurrence of `THREE.WebGLRenderer: Context Lost.` during a fast scroll sweep. Prod recovers (no pageerror), but it's a real GPU-side event — usually the browser deciding to evict a backgrounded context. May indicate `dpr={[1, 1.8]}` + `multisampling={0}` is over-allocating textures for some discrete-GPU machines. Investigate `dpr` cap.

### NB-F4. `THREE.Clock` deprecation warning (unchanged since Phase A)
Upstream r3f. One warning per page load. Not actionable in this repo.

### NB-F5. ScrollHeight 20156 (E prod) → 17656 (F prod) = 2500 px shorter
Probably from the smaller LiveSandpack collapsed button. Worth noting because it shifts every absolute pixel referenced in the Phase E alignment table — but the *relative* (percentage-based) alignment is preserved, which is why my matrix above still passes.

### NB-F6. The `[data-nextjs-toast]` selector I used as a "dev overlay present" probe matched the Next.js dev toolbar pill too
My harness reports `errorOverlayPresent: true` even at scroll 0 because the bottom-left `N` toolbar is always there in dev mode. The real signal is `canvasCount` and `bodyH1` — those flip from `1, "Build a Spark cluster…"` to `0, "This page couldn't load"` when the runtime overlay fires. Recording this as a self-correction note for future critics — don't rely on `[data-nextjs-toast]` to detect crashes.

### NB-F7. Phase E NB-E2 (scene 12 finale under-delivers) is now mostly resolved
The fly scene has been polished — multi-colored cubes (orange + blue + teal + light-blue), 8 workers, the end-of-article footer with "Back to landing" link, and auto-rotate-then-give-controls UX. `docs/screenshots/phaseF/100-prod.png` is a satisfying payoff frame. Pre-existing NB-E2 retired.

---

## Phase A B1-B6 confirmation matrix

| ID | Phase A finding | Phase F status |
|---|---|---|
| **B1** | Double `.scene-canvas` sticky siblings | STILL FIXED (canvasCount = 1) |
| **B2** | Canvas wrapper `-z-10` against opaque bg | STILL FIXED |
| **B3** | `THREE.Color("oklch(...)")` defaulting to white | STILL FIXED (zero OKLCH warnings in prod) |
| **B4** | Four independent `useScrollProgress` rAFs | STILL FIXED |
| **B5** | Header below the fold | STILL FIXED (h1Y = 168) |
| **B6** | Shuffle unscorable | STILL FIXED + **now unobstructed by Sandpack** |

---

## What works (credit where due)

- **The Sandpack collapse is the cleanest fix in this phase.** The shuffle scene at scroll 66 % now reads as a single composed editorial moment instead of a half-canvas occluded by a code editor. The collapsed button is on-theme (mono, uppercase, tracked) and discoverable.
- **MobileKicker retires NB5.** The fixed top-left scene-of-12 pill on `<md` viewports gives mobile users the per-scene context they'd been missing for three phases.
- **Production console is silent of pageerrors across 17 scroll samples.** Build and lint stay clean.
- **CameraRig now reads from the same source-of-truth as SceneStage's scene selection** (commit b907cfa). This is the right architecture; it just needs to clamp the lerp earlier so the worker cube doesn't fall out of frame.
- **SceneFrame is a sensible idea** — even though it doesn't solve B-F1, it does meaningfully reduce SceneStage re-renders and is a building block for the fix.

## What to fix first

1. **B-F1** — the dev crash. Try option (b): pull `<EffectComposer>` into its own `"use client"` component and load it via `next/dynamic({ ssr: false })`. HMR will then re-establish the composer on each Fast Refresh without racing the renderer. If that's too invasive, option (a) — `<Suspense fallback={null}>` wrap — is one line and may be enough. Test by `git stash` + manual scroll in `localhost:3737/spark` after every save.
2. **B-F2** — clamp the camera lerp. Change CameraRig's `t = local * local * (3 - 2 * local)` to `t = Math.max(0, (local - 0.85) / 0.15); t = t*t*(3 - 2*t);`. Re-check `16-prod.png`: the worker cube should be centre-frame, just like the orange driver at scroll 25 % is.
3. **NB-F1** — mobile-50 prose-cube overlap. Either shift the prose card to a sticky bottom on `<md`, or scoot the cube cluster off to the right.

---

## Files referenced

- `components/three/SceneStage.tsx:1-76` — current state (post-SceneFrame refactor); `<Canvas>` at line 48 is the crash site reported by the dev overlay
- `components/three/SceneFrame.tsx:20-45` — NEW; reads `readActiveSectionLocal()` inside `useFrame`, throttled `setState` cadence (40 ms / 0.05 jump)
- `components/three/scenes/EphemeralCycle.tsx:24` — `baseScale = 0.4 + spawn * 0.6` (unchanged since Phase E)
- `components/scroll/CameraRig.tsx:30-56` — reads `readActiveSection()` + `readActiveSectionLocal()` directly inside `useFrame` (commit b907cfa); waypoints unchanged from Phase E; mobile pullback `zScale=1.45 yScale=1.15` unchanged
- `components/code/LiveSandpack.tsx:11-49` — collapsed-by-default with `▷ try the shuffle key live` button (commit df2aad6)
- `components/scroll/MobileKicker.tsx` (NEW) — fixed top-left scene-of-12 pill for `<md` viewports (commit f17c7dc); reads `useActiveSceneId()`
- `lib/useActiveSection.ts:14-110` — IO source-of-truth; exposes `useActiveSection()` (React subscribe), `readActiveSection()`, `readActiveSectionLocal()` (imperative for `useFrame`)
- `app/spark/page.tsx` — unchanged
- `lib/scenes.ts` — unchanged

---

## Evidence artefacts

- `docs/screenshots/phaseF/landing.png` — landing page (dev), clean
- `docs/screenshots/phaseF/0.png` — dev /spark at scroll 0, hero cluster rendered cleanly
- `docs/screenshots/phaseF/8.png` — dev /spark at scroll 8, prose "A cluster, asleep." visible — page still alive
- `docs/screenshots/phaseF/{16,25,33,42,50,58,66,75,83,92,100}.png` — **all show the Next.js dev runtime error overlay** (`Runtime TypeError: Cannot read properties of null (reading 'alpha')` pointing at `SceneStage.tsx (48:7)`)
- `docs/screenshots/phaseF/mobile-{0,33,50,75}.png` — dev /spark mobile, scroll 0 alive, 33/50/75 all show "This page couldn't load"
- `docs/screenshots/phaseF/_console.json` — dev console; includes `[Fast Refresh] rebuilding`, `THREE.WebGLRenderer: Context Lost.`, and the deprecation warning
- `docs/screenshots/phaseF/_errors.txt` — 4 distinct alpha-null TypeErrors, all `EffectComposer.addPass`
- `docs/screenshots/phaseF/_dom.json` — desktop scene-state records; first two scrolls alive, the rest show `bodyH1: "This page couldn't load"`, `canvasCount: 0`, `sectionsCount: 0`
- `docs/screenshots/phaseF/_mobile_state.json` — mobile scene-state records; same shape
- `docs/screenshots/phaseF/{0..100}-prod.png` — PROD reference build, all 13 scrolls; every scene renders cleanly except **`16-prod.png` shows starfield only (scene 2 anatomy still empty — B-F2)**
- `docs/screenshots/phaseF/mobile-{0,33,50,75}-prod.png` — PROD mobile reference; all four show 3D geometry; `mobile-50-prod.png` shows the new MobileKicker top-left pill
- `docs/screenshots/phaseF/_console-prod.json` — prod console; zero pageerrors, only the upstream Clock + Chromium GPOS/GSUB noise
- `docs/screenshots/phaseF/_errors-prod.txt` — **empty** (zero pageerrors across 17 scroll samples)
- `docs/screenshots/phaseF/_dom-prod.json` — prod scene-state records; perfect alignment matrix
- `docs/screenshots/phaseF/_mobile_state-prod.json` — prod mobile state records; perfect alignment

---

**Verdict: FAIL — 80 / 100. Phase advance blocked. Two of the three Phase E blockers reappear unchanged: B-E1 (dev crash) is still present at the same call site with the same error, because the Phase E fix addressed the wrong root cause (the trigger is HMR module re-evaluation, not bloomIntensity-driven React re-renders); B-E2 (scene 2 anatomy empty at scroll 16 %) is also still present because the camera lerp still overshoots the anatomy waypoint by section-local ≈ 0.65. B-E3 (Sandpack occlusion) is decisively resolved by the collapsed-by-default editor and the shuffle now reads as the centerpiece moment the brief asks for. The mobile-50 frame additionally confirms B-D3 still resolved and the new MobileKicker retires NB5. The dev crash makes the prototype unusable in dev mode — the exact environment the brief specifies — so the score must reflect FAIL until B-F1 lands. Top 3 fixes for the next iteration: (1) wrap `<EffectComposer>` in a dynamic-import or Suspense boundary so HMR can re-establish it without racing the renderer; (2) clamp the camera lerp's `t` to stay on the active waypoint until section-local ≈ 0.85; (3) shift the mobile prose card off the cube cluster in scene 6.**
