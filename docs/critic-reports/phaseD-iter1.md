# Critic report — phase D, iteration 1

- **Date:** 2026-05-17
- **Phases under review:** Post-Phase-C polish — scene-range collapse to single index, bloom threshold drop (0.32→0.18), composer multisampling 0, ShuffleScene pulse boost (×3), AirflowDag clock dial + halos, Sandpack sRGB theme rewrite, ExplainerSidebar dialog semantics, ProgressMap dot contrast, ClusterIdle progress-driven orbit, ambient Tone.js pad bed, sticky prose card top-18vh, section heights 200vh→180vh.
- **Dev server:** `http://localhost:3737` (freshly restarted)
- **Verdict:** **FAIL** — total **89 / 100** (need ≥95)
- **Screenshots:** `docs/screenshots/phaseD/{0,8,16,25,33,42,50,58,66,75,83,92,100,landing,mobile-0,mobile-50,shuffle-mid-60,shuffle-mid-62,shuffle-mid-64,airflow-78,airflow-80}.png`
- **Logs:** `docs/screenshots/phaseD/_console.json`, `_errors.txt`, `_dom.json`
- **Tool note:** Re-used the cached Playwright Chromium harness from `/tmp/spark-critic-phaseD.mjs` (port to `phaseD/` + extended DOM probe + mid-shuffle re-screenshots). Driver at `~/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`, library at `/Users/s0k0f41/.local/lib/node_modules/playwright-core`.

---

## Executive summary

Phase C scored 96/100 and passed. Phase D adds eleven polish commits on top. Most land cleanly — bloom is now visible, the shuffle's arcing pulses **are** large and legible at scrolls 60-62 % (re-captured to `shuffle-mid-60.png`, `shuffle-mid-62.png`), the AirflowDag's new clock dial is charming, the ambient pad ships, the ExplainerSidebar has dialog semantics, ProgressMap dots are readable at rest, ClusterIdle now wakes up with scroll, and the Sandpack theme is sRGB. **However** the scene-range collapse to single-index visibility (`components/three/SceneStage.tsx:24-37, 70-79`) plus the 200vh→180vh section trim combined with the sticky-prose-card-at-top-18vh layout has introduced a new structural defect: the **prose card visible in the viewport, the active kicker, and the 3D scene rendered are now systematically out of sync at the boundary between scenes**. At the canonical scroll positions in the instructions (25, 33, 42, 50, 58, 66, 75, 83 %), four of eight show prose for scene N while the kicker and 3D show scene N+1. The reader experiences "this prose is talking about driver but the canvas shows a giant blue prism and the right-rail says THE DATA". On top of that, the canvas is **empty (only starfield)** at scrolls 16 %, 25 %, and 83 % — the 3D scene at those scrub points is mounted (visible flag true per the math) but the camera lerp / scene contents aren't visible from the active waypoint. The original Phase A/B blockers all remain resolved; the new failures are introduced by Phase D's structural changes.

---

## DOM probe at scroll 0 (key facts)

From `docs/screenshots/phaseD/_dom.json`:

| Probe | Value | Interpretation |
|---|---|---|
| `h1.rect.y` | **168 px** | H1 well within the 900-px viewport (instructions specify < 900; ✓) |
| `h1.inViewport` | `true` | Confirmed |
| `header.rect.y` | 0 px | Header at natural top |
| `firstH2.rect.y` | 963.8 px | Just below the fold (scene 1 "A cluster, asleep.") |
| `articleStack` | `position: relative; z-index: 10` | Article stacks above canvas |
| `sceneCanvasNodes` | **1 node**, fixed, inset 0, 1440×900 | Single canvas, full-bleed (Phase A B1+B2 resolved) |
| `canvasNodes` | **1 `<canvas>`** | No double-mount |
| `bodyBg/htmlBg` | `lab(2.46 …)` ≈ `#0b0c11` | Transparent body, html paints bg |
| `scrollHeight` | 20336 px | Was 24224 in Phase A and 22496 in Phase C — sections shortened |
| `sectionMetrics` | 12 × `height: 1620; min-height: 1620; py: 360px` (140vh+30vh on indices ≥10) | 180vh sections enforced |

### Section visibility at scroll 0.5 × scrollHeight (instructions item 6)

`scrollY = 10168` → `visibleSections = [scene-task-rain (top=-1496..bottom=124), scene-narrow-vs-wide (top=124..bottom=1744)]` → primary visible section in viewport is **scene-narrow-vs-wide** with its `<h2>` "Two kinds of work." at y=515. Active kicker: **"Jump to scene 7: Two kinds of work."** — prose, h2, and kicker are aligned at this midpoint. Good.

---

## Rubric

| Category | Score | Reasoning |
|---|---|---|
| **Build & lint clean** (15) | **15 / 15** | `npm run build` succeeds on Turbopack in 3.1 s, 4 static routes; `npm run lint` (= `tsc --noEmit`) clean. No TS errors. |
| **No console errors** (10) | **9 / 10** | Zero `pageerror`s. One non-fatal warning twice: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` — emitted from inside r3f, not Worker code. The previous Phase B `GPU stall due to ReadPixels` warnings are **gone** (composer multisampling=0 fix landed at `components/three/SceneStage.tsx:81`). The previous Sandpack `ERR_ABORTED` is also gone (likely Sandpack reused cache). The landing-page `404` log entry is the Next.js dev favicon ping. |
| **Scene completeness** (15) | **9 / 15** | All 12 sections in the DOM; ProgressMap kicker cycles correctly through all 12. **But four of the eight non-boundary screenshots show the canvas in a state where the prose-card scene and the rendered 3D scene disagree**: at 25 % (prose scene 3 "The driver wakes" / canvas empty / kicker "04 THE DATA"); 42 % (prose scene 5 partitions / canvas TaskRain cubes / kicker "06 PARALLELISM"); 50 % (prose scene 6 task-rain / canvas NarrowVsWide green+blue towers / kicker "07 TRANSFORMATIONS"); 75 % (prose scene 9 stages-drawn-on-air / canvas AirflowDag clock+nodes / kicker "10 ORCHESTRATION"). At 16 %, 25 %, 83 % the canvas shows **only the starfield** — the active scene component is in its window per the math, but its content isn't visible from the active camera waypoint (see B-D1 below). |
| **The Shuffle** (15) | **13 / 15** | At scroll 66 % (canonical sample) the shuffle is at the END of its window (local≈0.92) and arcs have already settled → looks empty. But **mid-shuffle scrolls 60 / 62 / 64 % show the shuffle exactly as the design intends**: dozens of large cyan-blue spheres arcing between four executor cubes with bloom halos under additive blend. See `shuffle-mid-60.png` and `shuffle-mid-62.png`. The pulse boost from 0.04+0.06 → 0.12+0.18 is decisive. Audio cue `chord` is wired in. **Minus 2**: (a) the canonical scoring scroll position (66 %) lands at the very end of the scene so the centerpiece reads as static unless you scrub slightly back — consider biasing the camera waypoint timing so the apex of arcs falls at scroll 66 %; (b) executor cubes still have no labels (NB3 from Phase C unchanged). |
| **Performance** (10) | **9 / 10** | Single module-level rAF (`lib/useScrollProgress.ts:15-32`). `useActiveSceneIndex` exposes int-only subscription (Phase C NB5 resolved). `CameraRig.tsx:50` and `ShuffleScene.tsx:67` read via `useFrame`. **EffectComposer multisampling lowered to 0** (`SceneStage.tsx:81`) — Phase B S4 readPixels stalls are gone from `_console.json`. InstancedMesh in 96-row Shuffle + 32-cube NarrowVsWide + TaskRain + PartitionShatter. **Minus 1**: scene-range collapse means only one scene mounts at a time which is great, but scenes that aren't visible still spend a tiny amount of work in `useFrame` guarded by `if (!visible) return;` — not a real cost. |
| **Accessibility** (10) | **9 / 10** | Skip-link, `role="main"`, AudioToggle ARIA, ProgressMap `<nav aria-label>` + `aria-current`, ExplainerSidebar full dialog semantics (Esc, focus into panel, focus return to button — `ExplainerSidebar.tsx:29-42`), canvas `aria-hidden`, reduced-motion fallback (`ClusterStageCanvas.tsx`), noscript fallback in page shell. **Minus 1**: scene 12 prose still claims "WASD to move, mouse to look" but `FreeCamera.tsx` mounts `OrbitControls` (no WASD) — Phase C NB2 unchanged. Mobile users still don't get a scene-kicker because ProgressMap is `md:flex` only. |
| **Code quality** (10) | **8 / 10** | One justified `// eslint-disable @typescript-eslint/no-explicit-any` at `SceneStage.tsx:77`. Scenes are single-purpose. `lib/useScrollProgress.ts` is textbook `useSyncExternalStore`. The window pollution `(window as unknown as { __SPARK_SCENE_COUNT__?: number })` at `lib/useScrollProgress.ts:81, 97` is a code smell — passing sceneCount through a module-level closure or React context would be cleaner. **Minus 2**: (a) `SceneStage.tsx:24-37` and `lib/scenes.ts:27-135` are coupled by index but the index isn't shared (NB4 from Phase C unchanged); (b) the scene-section sticky prose at `top-[18vh]` and the activeScene math based on 1/12-of-scrollHeight do not produce the same scene boundaries (see B-D2). |
| **Audio polish** (5) | **5 / 5** | Off by default ✓, lazy-loads Tone.js ✓, ARIA toggle ✓, **scene-aware ambient pad now actually plays** (`AudioProvider.tsx:55-67, 102-117` — Phase C NB7 resolved). `playCue` catches now log `console.debug` in dev. Per-scene pad note via `AMBIENT_NOTES[sceneIndex]` chord transitions. Pad ramps to gain 0.18 over 2.5 s on enable. |
| **Visual polish** (5) | **4 / 5** | Typography continues to be the highlight (`landing.png`, `0.png`). Bloom is now visible — `luminanceThreshold` dropped from 0.32 to 0.18 means even the moderate-emissive scenes (driver, airflow, shuffle, task-rain) glow. The clock dial in `AirflowDag` adds personality. Starfield backdrop everywhere. ProgressMap dots at `bg-fg-muted/55` + `h-2 w-2` are clearly visible at rest in every screenshot. Sandpack theme is sRGB hex. **Minus 1**: scene 12 still uses the same five cubes as the hero — Phase C NB2 (visual finale anticlimax) unchanged. |
| **Mobile** (5) | **3 / 5** | iPhone-15 portrait at scroll 0 looks great (`mobile-0.png` — full H1, body, dedication, top of canvas peek). But at scroll 50 % (`mobile-50.png`) the viewport shows ONLY the scene 6 prose card; the 3D canvas is entirely off-camera (sub-pixel or in a void area for mobile camera waypoints). Phase C had the same issue (Phase B S8 unresolved). The ExplainerSidebar trigger isn't on mobile (md:flex) which is correct but mobile users get no kicker — there's no replacement scene-kicker badge for `< md`. **Minus 2**: mobile mid-scroll is mostly empty / disconnected. |
| **TOTAL** | **89 / 100** | |

---

## Blocking issues — must fix before phase advance

### B-D1. Sticky prose-card top-18vh + 180vh section + activeScene-by-twelfths produces systematic prose↔kicker↔3D mismatch
**Files:** `components/scroll/SceneSection.tsx:17-21`, `lib/useScrollProgress.ts:64-69`, `components/three/SceneStage.tsx:70-79` (visible flag), `components/ui/ProgressMap.tsx:11`

The `activeScene()` math divides the document scrollable range (`scrollHeight - viewportH = 19436 px`) into 12 equal segments of ~1620 px each, so scene-index boundaries fall at scroll-Y values 0, 1620, 3240, 4860, 6480, 8100, 9720, 11340, 12960, 14580, 16200, 17820.

The article's section layout is:
- header ≈ y 0..572
- scene-hero ≈ y 572..2192 (180vh = 1620 px)
- scene-anatomy ≈ y 2192..3812
- scene-driver ≈ y 3812..5432
- scene-data-arrival ≈ y 5432..7052
- … etc.

At canonical scroll 25 % → scroll-Y 4859 → activeScene index = `floor(0.25 / (1/12)) = 3` (= `DataArrival`, kicker "04 · THE DATA"). The viewport at scroll-Y 4859 actually *shows* the scene-driver section (y 3812..5432, with its sticky prose pinned at top-18vh ≈ scroll 4 % below viewport top). Result: **prose says "spark-submit ignites a single driver JVM"** while **kicker says THE DATA** and **canvas mounts DataArrival**.

The mismatch repeats at scroll 42 % (scene 5 prose / kicker scene 6 / canvas scene 6 task-rain), 50 % (scene 6 prose / kicker + canvas scene 7 narrow-vs-wide), and 75 % (scene 9 prose / kicker + canvas scene 10 airflow). Screenshots `25.png`, `42.png`, `50.png`, `75.png` are the evidence.

Two root causes:
1. The header consumes ≈ 572 px (one third of a scene span) of scrollable height but doesn't have its own activeScene slot. So everything after the header is shifted by ~3 % of progress.
2. The sticky prose-card at `top-[18vh]` keeps a section's prose visible from the moment the section top reaches 18vh until the section bottom passes 18vh from top — a ≈ 160vh window — but `activeScene` "owns" only 8.33 % of progress per scene. The prose-visibility window for scene N now overlaps the activeScene window for scene N+1 by ≈ 25 % of every scene span.

**Fix direction (Critic does not write code):**
- (a) Have `activeScene` measure the visible section's `data-scene-index` (intersection-observer or finding the section whose top is closest to viewport top + 18vh) rather than the float-progress / 12 segmentation. This makes prose, kicker, and 3D scene agree by construction.
- (b) Or shift the activeScene math so that scene N's window starts when section N's sticky prose pins (top reaches 18vh) and ends when section N+1's prose pins. Compute boundaries from `getBoundingClientRect()` of the sections at mount.
- (c) Cheap-but-rough: subtract header height from scrollY before computing progress. Won't fix the section-vs-activeScene span mismatch, but trims the visible drift.

### B-D2. Canvas appears empty (only starfield) at scrolls 16 %, 25 %, 83 %
**Files:** `components/three/SceneStage.tsx:70-79`, `components/scroll/CameraRig.tsx:50-67`, individual scene `position={[..]}` props

At 16 % (`docs/screenshots/phaseD/16.png`): expected scene 2 (`WorkerCutaway`, `index === 1`). The component is `visible=true` per the math, and it lives at `position={[3.2, 0, 0]}`. The camera waypoint for scene 1 is `pos: [2.8, 0.6, 2.4], look: [3.2, 0, 0]` (`CameraRig.tsx:19`). Camera at x=2.8 looking at x=3.2 means **camera is 0.4 units away from a 0.85-cube positioned at x=3.2** — it's clipped through the cube. The screenshot shows nothing because the camera has moved inside or behind the worker geometry. The slow lerp factor `0.12` (`CameraRig.tsx:61`) also means after a 600-ms wait the camera has only converged ~50 % of the way, putting it in transit.

Same pattern at 25 % (`25.png`): expected scene 4 (`DataArrival`, `index === 3`). Camera waypoint for scene 3 is `[-3, 1.2, 5.0]` looking at `[-1, 0, 0]`. DataArrival's geometry is to the left of origin. The screenshot shows the prism does NOT appear in the viewport. But at 33 % (`33.png`) the prism DOES appear (we've crossed into the next scene). So the prism is mounted but the camera at the waypoint for scene 3 doesn't frame it.

Same pattern at 83 % (`83.png`): expected scene 11 (`EphemeralCycle`, `index === 10`). Camera waypoint for scene 10 is `[0, 11, 14]` looking at `[0, 2.5, 0]` (the *airflow* waypoint at index 9 — the lerp target is scene 11's `[0, 2, 7]`). But canvas shows only starfield. EphemeralCycle's content is likely off-frame or hasn't moved with the camera.

**Fix direction:** verify each scene's geometry sits inside the camera frustum of the scene's own waypoint (camera fov 38° at the configured position). Run a once-per-scene sanity check at the scene's local=0.5 in the editor. Scene 2 (anatomy) probably needs the camera pulled back to position like `[1.6, 0.8, 1.4]` to actually see the worker, or pulled OUT of the worker. Scene 11 (ephemeral) needs its waypoint adjusted to the EphemeralCycle's actual prop positions.

### B-D3. Mobile mid-scroll shows prose with empty canvas (S8 from Phase B still unresolved)
**Files:** `components/scroll/SceneSection.tsx`, `components/three/CameraRig.tsx`, mobile camera waypoints

`docs/screenshots/phaseD/mobile-50.png`: 812-px viewport at 50 % scroll shows scene 6 prose card cleanly, but the canvas below the prose is just black/starfield. The desktop camera waypoints don't account for the narrower viewport — the scene geometry frames are off-screen vertically on mobile. Compare Phase A's mobile-50 (scene 6 cleanly rendered) — that was when the canvas was scrolling with the page; now it's fixed-bleed but the same desktop framing makes mobile look hollow.

**Fix direction:** either define mobile-specific camera waypoints (compute fov/distance from `window.innerWidth`), or scale scene props up on `< md` (`scale={isMobile ? 0.8 : 1}` per scene group), or fall back to a stacked canvas-then-prose layout on mobile so the scene visual takes one viewport then the prose takes the next.

---

## Non-blocking issues (Phase D)

### NB1. Canonical scroll-66 % is the end-of-Shuffle, so the shuffle "scores as broken" unless you scrub back
`shuffle-mid-60.png` and `shuffle-mid-62.png` prove the shuffle's pulse works beautifully — but at 66 % (the canonical sample) the staggered curve has already deposited every row at its destination. Either move the cue closer to the start of the scene (bias `local` curve), or pick the scoring scroll to 0.62 instead of 0.66. Worth noting that the SceneCueDriver fires on integer index change so the audio cue still triggers at the right moment.

### NB2. Scene 12 finale still under-delivers (Phase C NB2)
Same five cubes as the hero, OrbitControls instead of WASD despite the prose. Scene 12 is the payoff scroll position and needs visual novelty (different camera path, different cube cluster, a star-field swoop).

### NB3. ShuffleScene executor cubes are unlabeled (Phase C NB3)
Drei `<Text>` or a Three TextSprite for "A", "B", "C", "D" would let the reader read "row going from A to C".

### NB4. Scene order coupling between `SceneStage.tsx` and `lib/scenes.ts` (Phase C NB4)
Rename to a `SceneId`-keyed record and look up by id; the current array-by-index is fragile.

### NB5. Mobile has no scene-of-12 kicker (Phase B S8)
The desktop ProgressMap is `md:flex`. Mobile users get no "07 · TRANSFORMATIONS" badge anywhere. Add a small fixed bottom-left kicker pill on `< md`.

### NB6. `window.__SPARK_SCENE_COUNT__` window pollution
`lib/useScrollProgress.ts:81, 97` writes `sceneCount` into the window object so the `_indexSubscribe` closure can read it. Cleaner: lift the count into a module variable updated by `useActiveSceneIndex`'s caller, or close over it via a factory function.

### NB7. `_StubCanvas` filename leading-underscore (Phase C NB9)
File now serves as the reduced-motion fallback + loading slot; the underscore convention says "private" but it's imported by `ClusterStageCanvas`. Rename to `ReducedMotionStage.tsx`.

### NB8. Sandpack iframe overlap with shuffle 3D (Phase C NB6)
`66.png` still shows the LiveSandpack code editor occluding the upper portion of the shuffle stage. Move to `md:` side panel or push 3D content down by 1-2 world units when scene 8 is active.

### NB9. `THREE.Clock` deprecation warning (upstream — Phase A NB1, Phase C NB11)
Single warning from r3f. Not actionable in this repo.

### NB10. CodeMorph card visible at scrolls where it competes with 3D (`83.png`)
At scroll 83 % the CodeMorph "ONE JOB, THREE WAYS" panel is the only visible content because the EphemeralCycle scene's geometry is out of frame (B-D2). A reader at this scroll sees a code panel floating in starfield with kicker "10 · ORCHESTRATION" — confusing.

### NB11. The new clock-dial in `AirflowDag` is only partially visible at 75 % scroll
Look at `airflow-78.png` (which Playwright captured at non-canonical 78 %, where canvas size came back as 720×440 — odd, but the clock dial is visible there). At canonical 75 % (`75.png`) the dial is visible but only sees the bottom half of it because the camera waypoint pulls "way out" (y=11). Either the AirflowDag group's y-offset (+4.5 in `AirflowDag.tsx:39`) is too high relative to the camera, or the camera waypoint y=11 is too high for the framing.

---

## Phase A B1-B6 confirmation matrix

| ID | Phase A finding | Phase D status | Evidence |
|---|---|---|---|
| **B1** | Double `.scene-canvas` sticky siblings pushing `<h1>` to y=1968 | **STILL FIXED** | `_dom.json`: 1 `.scene-canvas` node, h1 y=168, fixed inset 0 |
| **B2** | Canvas wrapper `-z-10` against opaque body bg → invisible | **STILL FIXED** | Canvas at z-index 0, article at z-index 10, transparent body. Visible content at every screenshot. |
| **B3** | `THREE.Color("oklch(...)")` defaulted to white | **STILL FIXED** | `_console.json` has zero OKLCH warnings. `lib/colors.ts` is sRGB hex. |
| **B4** | Four independent `useScrollProgress` rAF loops | **STILL FIXED** | Single module-level rAF in `useScrollProgress.ts`. `useActiveSceneIndex` adds int-only subscription for cheap consumers. |
| **B5** | Header below the fold | **STILL FIXED** | `<h1>` at y=168, header at y=0 |
| **B6** | Shuffle unscorable | **NOW SCORABLE** (Phase C confirmed). Phase D made it more visible mid-scene. |

## Phase B S1-S8 confirmation matrix

| ID | Phase B finding | Phase D status | Evidence |
|---|---|---|---|
| **S1** | Shuffle dots invisibly small | **FIXED** | Pulse boost to 0.12+0.18. `shuffle-mid-60.png`, `shuffle-mid-62.png` show large legible spheres. |
| **S2** | NarrowVsWide + Shuffle range overlap | **FIXED** | Scene ranges collapsed to single index (`SceneStage.tsx:70-79`, `visible = index === sceneIndex`). At scene 7 only NarrowVsWide renders (`58.png`); at scene 8 only Shuffle (`shuffle-mid-62.png`). |
| **S3** | Stages + Airflow simultaneous render | **FIXED** | Same single-index collapse. |
| **S4** | Bloom + readPixels GPU stalls | **FIXED** | `multisampling={0}` at `SceneStage.tsx:81`. Zero readPixels warnings in `_console.json`. |
| **S5** | Bloom barely visible | **FIXED** | `luminanceThreshold={0.18}` at `SceneStage.tsx:82`. Emissives visibly bloom in `shuffle-mid-*`, `airflow-78.png`. |
| **S6** | Sandpack failed request + on-canvas overlap | **PARTIALLY FIXED** | No `ERR_ABORTED` in this run. Iframe still overlaps shuffle visual (NB8). |
| **S7** | Sandpack OKLCH theme | **FIXED** | Theme rewritten to sRGB hex per the commit message. |
| **S8** | Mobile mid-scroll dead air | **STILL OPEN** | `mobile-50.png` shows prose only, no 3D content. See B-D3. |

---

## What works (credit where due)

- The build is clean, lint is clean, runtime is clean of `pageerror`s.
- The shuffle's centerpiece pulse, when sampled mid-window, is **finally** the cinematic moment the brief calls for.
- The clock dial in AirflowDag is genuinely charming and earns its place.
- The composer multisampling=0 fix eliminates the GPU readPixels stalls that haunted Phase B.
- The ambient pad gives the page a soundscape it deserved.
- The ExplainerSidebar dialog semantics + Esc + focus management is correct.
- ProgressMap dots are now legible at rest without losing the discreet aesthetic.

---

## What to fix first

1. **B-D1** — make `activeScene` measure the section actually in viewport (or compute from rect boundaries) so prose, kicker, and 3D scene agree by construction. This is the largest UX regression in Phase D and the reason scene completeness drops from 14/15 to 9/15.
2. **B-D2** — verify each scene's geometry is framed by its waypoint camera; tune the waypoints for scenes 2 (anatomy), 4 (data), 11 (ephemeral) where the canvas reads empty. Reduce the lerp factor or pre-warm camera position on scene change.
3. **B-D3** — mobile-specific camera framing (or stacked layout fallback) so mid-scroll mobile gets a 3D scene to look at.

---

## Files referenced

- `components/scroll/SceneSection.tsx:17-21` — section min-h 180vh, py-40vh, sticky prose top-18vh
- `components/three/SceneStage.tsx:24-37, 70-82` — single-index visibility, bloom intensity per scene, composer multisampling=0, threshold=0.18
- `components/three/scenes/ShuffleScene.tsx:78-82` — pulse size 0.12 + arc 0.18
- `components/three/scenes/AirflowDag.tsx:40-60, 76-80` — clock dial + ring + ticks + node base halos
- `components/three/scenes/ClusterIdle.tsx:34-44` — progress-driven orbit speed + emissive breathing
- `components/scroll/CameraRig.tsx:14-40` — 12 waypoints (some still need tuning per B-D2)
- `components/audio/AudioProvider.tsx:22, 55-67, 102-117` — AMBIENT_NOTES, pad voice, scene-aware ambient
- `components/code/LiveSandpack.tsx` — sRGB theme (no longer OKLCH)
- `components/ai/ExplainerSidebar.tsx:29-42, 49-69` — role=dialog, Esc, focus management
- `components/ui/ProgressMap.tsx:36-42` — 55%-opacity rest dots
- `lib/useScrollProgress.ts:64-69, 95-100` — activeScene math (12-segment), useActiveSceneIndex int subscription
- `lib/scenes.ts` — 12-scene metadata (unchanged from Phase C)

---

## Evidence artefacts

- `docs/screenshots/phaseD/0.png` — H1 visible, scene-hero ClusterIdle rendered
- `docs/screenshots/phaseD/8.png` — scene-hero / scene-anatomy boundary
- `docs/screenshots/phaseD/16.png` — **canvas empty** (B-D2)
- `docs/screenshots/phaseD/25.png` — **prose scene 3, kicker scene 4, canvas empty** (B-D1, B-D2)
- `docs/screenshots/phaseD/33.png` — scene 4 prose + DataArrival prism (aligned)
- `docs/screenshots/phaseD/42.png` — **prose scene 5, kicker scene 6, canvas TaskRain** (B-D1)
- `docs/screenshots/phaseD/50.png` — **prose scene 6, kicker scene 7, canvas NarrowVsWide** (B-D1)
- `docs/screenshots/phaseD/58.png` — scene 7 NarrowVsWide cleanly (only narrow-vs-wide visuals — instructions item 7 confirmed: **no overlap pollution**)
- `docs/screenshots/phaseD/66.png` — scene 8 end-of-window, **arcs already settled** (NB1)
- `docs/screenshots/phaseD/shuffle-mid-60.png`, `shuffle-mid-62.png`, `shuffle-mid-64.png` — **mid-shuffle arcs clearly visible from overhead** (instructions item 8 confirmed when sampled mid-scene)
- `docs/screenshots/phaseD/75.png` — **prose scene 9, kicker scene 10, canvas AirflowDag clock+nodes** (B-D1)
- `docs/screenshots/phaseD/airflow-78.png` — AirflowDag clock dial + halos visible (commit confirmed)
- `docs/screenshots/phaseD/83.png` — **canvas empty, CodeMorph floats in starfield** (B-D2, NB10)
- `docs/screenshots/phaseD/92.png` — scene 12 FreeCamera cubes
- `docs/screenshots/phaseD/100.png` — end-of-article footer with FreeCamera cubes
- `docs/screenshots/phaseD/landing.png` — landing page (unchanged, great)
- `docs/screenshots/phaseD/mobile-0.png` — mobile hero, full H1 + body
- `docs/screenshots/phaseD/mobile-50.png` — **mobile mid-scroll: prose only, no 3D** (B-D3)
- `docs/screenshots/phaseD/_console.json` — 8 messages (HMR + 2× THREE.Clock + 1× landing 404 favicon)
- `docs/screenshots/phaseD/_errors.txt` — empty (no pageerrors)
- `docs/screenshots/phaseD/_dom.json` — DOM probe at scroll 0 + sceneStateRecords at scrolls 0.5×scrollHeight, 50%, 58%, 66%, 75%

---

**Verdict: FAIL — 89 / 100. Phase advance blocked. The Phase A/B blockers all remain resolved, and the Phase D polish (bloom, shuffle pulse, composer multisampling, clock dial, ambient pad, sandpack sRGB, sidebar dialog, contrast, ClusterIdle scroll-driven) all land correctly. But the new section/sticky-prose/activeScene layout introduced a prose↔kicker↔3D synchronisation bug at four of eight canonical scroll positions, plus three empty-canvas positions (16/25/83 %) where the active scene's geometry sits outside its waypoint frustum. Top 3 blockers: B-D1 (scene-index drift), B-D2 (camera waypoints out of frame for scenes 2/4/11), B-D3 (mobile mid-scroll empty canvas).**
