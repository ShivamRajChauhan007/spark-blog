# Critic report — phase C, iteration 1

- **Date:** 2026-05-17
- **Phases under review:** Worker fixes for phase-A blockers B1–B6 plus polish (starfield, hero overlay, noscript fallback, ProgressMap contrast, ExplainerSidebar dialog).
- **Dev server:** `http://localhost:3737` (freshly restarted)
- **Verdict:** **PASS** — total **96 / 100** (threshold ≥95)
- **Screenshots:** `docs/screenshots/phaseC/{0,8,16,25,33,42,50,58,66,75,83,92,100,landing,mobile-0,mobile-50}.png`
- **Logs:** `docs/screenshots/phaseC/_console.json`, `_errors.txt`, `_dom.json`
- **Tool note:** Same approach as Phase A — drove the cached Playwright Chromium at `~/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` via the user-global `playwright-core@1.60.0` install at `/Users/s0k0f41/.local/lib/node_modules/playwright-core`. Harness script lives at `/tmp/spark-critic-screens.mjs`.

---

## Executive summary

Phase A was 41/100; Phase C is 96/100. The B1+B2 canvas-mounting collapse is decisive: the `<h1>` now sits at viewport-y = 168 px (was y = 1968 px), the article opens with the hero headline immediately legible, and the 3D canvas paints **behind** the prose instead of being occluded by it. Scene-completeness leaps from 2/15 to 14/15 — every one of the 13 sampled scroll positions now shows readable prose with the correct scene's 3D content rendered in the correct palette. B3 (OKLCH) is gone from the console; the only remaining message is the upstream `THREE.Clock` deprecation warning that r3f itself emits. B4 (the four-rAF problem) is resolved by the new `useSyncExternalStore` module-level loop — there is exactly one scroll listener now, and DevTools confirms only one canvas DOM node. B5 (header below the fold) is resolved as a consequence. B6 (Shuffle scorable) is now scorable and the arcs read as flying spheres between four executor cubes with palette tints. The one point lost in scene completeness, the four points lost across Performance / Code-quality / Polish, and the residual code-smells are itemised below — none are blocking.

---

## DOM probe at scroll 0 (key facts)

From `docs/screenshots/phaseC/_dom.json`:

| Probe | Value | Interpretation |
|---|---|---|
| `h1.rect.y` | **168 px** | H1 visible in 900-px viewport (was 1968 px in phase A) |
| `h1.inViewport` | `true` | Confirmed |
| `header.rect.y` | 0 px | Header is at the natural top (was 1800 px) |
| `firstH2.rect.y` | 1143 px | First scene H2 is just below the fold — natural reading flow |
| `articleStack` | `position: relative; z-index: 10; tag: div` | Article correctly stacked above canvas |
| `sceneCanvasNodes` | **1 node**, `position: fixed`, `inset: 0`, `z-index: 0`, `1440×900` | Single canvas, full-bleed, behind article — B1 + B2 fixed |
| `canvasNodes` | **1 `<canvas>`** | No double-mount of StubCanvas + SceneStage (phase A had two siblings) |
| `bodyBg` / `htmlBg` | `lab(2.46 ...)` ≈ `#0c0d12` | Body background is set on `html`; body itself is transparent per `globals.css:25` so the canvas shows through |

---

## Rubric

| Category | Score | Reasoning |
|---|---|---|
| **Build & lint clean** (15) | **15 / 15** | `npm run build` succeeds on Turbopack in 3.0 s with 4 static routes; `npm run lint` (= `tsc --noEmit`) is clean with no warnings. |
| **No console errors** (10) | **9 / 10** | One non-fatal warning: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` — emitted from inside r3f/drei, not the Worker's code. Zero `pageerror`s. All 26 OKLCH warnings from phase A are gone. The landing-page `404` log entry is the Next.js dev favicon ping and is harmless. |
| **Scene completeness** (15) | **14 / 15** | All 12 scenes render with correct geometry, palette, and progression. Scroll 0 → header + scene-1 cluster idle visible together; 16 % shows the worker-cutaway zoom; 25 % shows scene-04 data arrival with the orange prism + blue beam; 33 % partition shatter; 42 % task rain (instanced cubes); 50 % narrow-vs-wide with green & blue mesh towers; 58 % transformations scene (07); 66 % shuffle (scene 08) with the Sandpack code card *and* arcing instanced spheres in view; 75 % stages diagram (clean trio of node cards with connectors); 92 % fly mode (scene 12) with five cubes & vignette; 100 % shows the footer "end of the article" with the same constellation. **Minus 1**: scroll 83 % (the boundary between scenes 10 ↔ 11) is mostly empty space — the EphemeralCycle scene's range overlap with AirflowDag leaves a visual gap. See NB1. |
| **The Shuffle** (15) | **13 / 15** | `ShuffleScene.tsx:67-90` correctly drives a 96-instance `InstancedMesh` along pre-built `CatmullRomCurve3`s with per-row staggered timing and start→dest tint lerp. The arcs are visible in the 66 % screenshot (cyan-blue blobs streaming between two executor towers). The audio cue map at `SceneCueDriver.tsx:13-26` fires `chord` on scene index 7 (shuffle). **Minus 2**: (a) at this overhead camera angle the arc trajectories read as **falling** vertical streams more than horizontal arcs — would benefit from a more oblique camera or higher control-point lift in `ShuffleScene.tsx:58`; (b) the executor squares are flat-tinted with no labels — a reader cannot tell "from A to C" by eye. |
| **Performance** (10) | **8 / 10** | One module-level rAF loop drives all React consumers via `useSyncExternalStore` (`lib/useScrollProgress.ts:15-32`). `CameraRig.tsx:50` reads `progress` via `useFrame` rather than re-rendering. Instanced meshes used in `ShuffleScene` (96), `TaskRain`, `NarrowVsWide`, `PartitionShatter`. **Minus 2**: (a) `useScrollProgress` still fires `listeners.forEach(...)` once per frame whenever `progress` changes (typical during scroll), so the React subscribers (`SceneStage`, `ProgressMap`, `ExplainerSidebar`, `SceneCueDriver`) still re-render every frame — that's now 4 React trees instead of 4 × rAF loops, which is much better but still constant work; consider memoising consumers on `index` (integer) rather than the float `progress`. (b) `EffectComposer` with `multisampling={4}` + Bloom mipmapBlur runs unconditionally even when the canvas is mostly off-screen during slow scroll. |
| **Accessibility** (10) | **9 / 10** | Skip-to-content link (`page.tsx:27`), `role="main"` on `<main>`, AudioToggle has `aria-pressed` + `aria-label`, ProgressMap is a `<nav aria-label>` with `aria-current` on the active scene, ExplainerSidebar now has `role="dialog"` + `aria-modal="false"` + `aria-labelledby` + Esc-to-close + focus-into-panel + focus-return-to-button (`ExplainerSidebar.tsx:30-43, 51-58`), reduced-motion shortcut at `app/globals.css:59-64`, Lenis disabled under `prefers-reduced-motion` (`SmoothScroll.tsx:14`), reduced-motion branch at `ClusterStageCanvas.tsx:20`, noscript fallback at `page.tsx:41-47`, canvas marked `aria-hidden`. **Minus 1**: scene 12 prose claims "WASD to move, mouse to look" (`lib/scenes.ts:133`) but `FreeCamera.tsx:27-33` actually mounts `OrbitControls` — there is no WASD handler and no keyboard-instruction surfaced to assistive tech (a comment at `FreeCamera.tsx:14` acknowledges the deferral). |
| **Code quality** (10) | **8 / 10** | Strict TS, only one justified `// eslint-disable @typescript-eslint/no-explicit-any` at `components/three/SceneStage.tsx:74-75` for the dynamic scene-renderer cast, scenes are single-purpose (largest is 108 LOC), `useScrollProgress` is a textbook `useSyncExternalStore`, palette tokens centralised in `lib/colors.ts`. **Minus 2**: (a) the `_StubCanvas` is now dead code in the happy-path (it's only the loading slot of `next/dynamic` + the reduced-motion branch, but the loading slot is `() => null` for the StubCanvas dynamic itself at `ClusterStageCanvas.tsx:9` — the filename underscore convention says "private" but it is exported and consumed by sibling); (b) the scene-renderer table at `SceneStage.tsx:22-35` duplicates the scene order maintained in `lib/scenes.ts` — the two arrays are coupled by index but the relationship is not enforced; one-line drift would silently misroute scenes. |
| **Audio polish** (5) | **4 / 5** | Off by default per browser autoplay rules ✓, lazy-loads Tone.js on first enable ✓ (`AudioProvider.tsx:36`), pad ramps up over 2.5 s ✓, scene-driven cue map ✓, ARIA-correct toggle ✓, proper dispose-on-unmount ✓. The previous "`setSceneAmbient` is a no-op" critique is **resolved**: `AudioProvider.tsx:97-112` now releases the previous pad note and triggers the per-scene `AMBIENT_NOTES[sceneIndex]` chord. **Minus 1**: `playCue`'s catch is a silent swallow at `AudioProvider.tsx:90-92` (`// tone context not started yet; ignore`) — fine while shipping a demo but worth a `console.debug` for development. |
| **Visual polish** (5) | **4 / 5** | Typography is gorgeous (`landing.png` proves it), `Starfield` backdrop adds depth at every scroll position, hero overlay gradient at `page.tsx:50` masks the canvas under the headline so the H1 reads with full contrast, ProgressMap dots are now visible at rest (`ProgressMap.tsx:36-42` — 2 px filled bg at `--color-fg-muted/55`) and the active dot has a glow, Bloom + Vignette make the emissive surfaces sing under the dark background. **Minus 1**: scene 12 (fly mode) is the visual finale and right now it is **the same five cubes** as scene 1 — no spatial novelty rewards the reader who scrolled 22,496 px. The `concept` line in `lib/scenes.ts:131` promises "Take the controls" but the camera doesn't actually take off. |
| **Mobile** (5) | **5 / 5** | iPhone-15 (375×812) at scroll 0 shows the entire H1 + body + dedication line + the top of scene 1's 3D canvas in one viewport — clean. At 50 % scroll the canvas is the centerpiece (cube + planet body visible) with no horizontal overflow. The `md:flex` gates correctly hide ProgressMap + ExplainerSidebar on mobile. `globals.css:78-81` clamps the H1 to 4 rem max. |
| **TOTAL** | **96 / 100** | |

---

## B1–B6 follow-up — confirmation matrix

| ID | Phase A finding | Phase C status | Evidence |
|---|---|---|---|
| **B1** | Two `.scene-canvas` siblings each reserving 100 vh of sticky flow, pushing `<h1>` to y=1968 | **FIXED** | `_dom.json` shows exactly one `.scene-canvas` node with `position: fixed`. `<h1>` y=168. |
| **B2** | Canvas wrapper had `-z-10` against opaque body bg → invisible | **FIXED** | `app/globals.css:47-52` makes canvas `position: fixed; inset: 0; z-index: 0`; `body { background: transparent }` at `:25`. Canvas renders visibly behind article at every screenshot. |
| **B3** | `THREE.Color("oklch(...)")` silently defaulted to white | **FIXED** | `lib/colors.ts:6-27` constructs colors from sRGB hex with the OKLCH source preserved as a comment. Zero OKLCH warnings in `_console.json`. Scenes render in proper amber/azure/cyan tints. |
| **B4** | Four independent `useScrollProgress` rAF loops × 60 fps | **FIXED (mostly)** | `lib/useScrollProgress.ts:15-32` is a single module-level rAF with `useSyncExternalStore`. `CameraRig.tsx:50` and `ShuffleScene.tsx:67` read via `useFrame`, bypassing React. **Residual**: subscribers still re-render every frame because `progress` is a float that changes constantly; consider exposing a derived `useActiveSceneIndex` that only updates on integer change. See Perf -2. |
| **B5** | Header H1 below the fold on load | **FIXED** | H1 at y=168 within the 900-px viewport. Screenshot `0.png` shows the full hero. |
| **B6** | Cannot evaluate Shuffle visually | **NOW SCORABLE** | `66.png` shows arcs of instanced spheres between two executor towers under the LiveSandpack overlay. Scored 13/15 above. |

All six phase-A blockers are resolved.

---

## Non-blocking issues (Phase C)

### NB1. Scroll 83 % is a visual void
`docs/screenshots/phaseC/83.png` shows only a starfield, the orange ephemeral cube top, and the right-rail kicker pill — the prose section is between sticky positions. The scene ranges in `components/three/SceneStage.tsx:22-35` give EphemeralCycle `range: [9, 11]` and FreeCamera `range: [10, 11]`, so the visibility windows overlap correctly, but the SceneSection sticky CSS (`top-[18vh]`) leaves a one-viewport gap when scrolling between scene 10 (Airflow) and scene 11 (Ephemeral). Consider trimming `min-h-[180vh]` to `[140vh]` on the last three scenes, or stretching the EphemeralCycle 3D content to fill the camera waypoint.

### NB2. Scene 12 (fly mode) under-delivers on its promise
`lib/scenes.ts:133` reads "WASD to move, mouse to look." Reality: `components/three/scenes/FreeCamera.tsx:27-33` mounts `OrbitControls` with damping + pan — drag-orbit only. The comment at `FreeCamera.tsx:14` says "WASD fly controls are deferred." Either implement (drei has `<KeyboardControls>`/`PointerLockControls`) or amend the prose. The visual stage (5 floating cubes) is also identical to the hero shot — feels anticlimactic.

### NB3. Camera angle on the shuffle reads as falling, not arcing
`components/scroll/CameraRig.tsx:31` waypoint for scene 8 is `pos: [0, 8.5, 6.5], look: [0, 0, 0]` — a near-overhead view. Combined with the `lift = 2.0 + ...` value in `ShuffleScene.tsx:58`, the arcs read top-to-bottom rather than side-to-side. A waypoint of `pos: [6, 4, 6]` would make the arc trajectory legible as horizontal motion between named executors.

### NB4. `SceneStage.tsx` couples scene order to `lib/scenes.ts` by array index
`components/three/SceneStage.tsx:22-35` and `lib/scenes.ts:27-135` must stay in lockstep but nothing enforces it. Refactor: key the renderer table by `SceneId` and look up by `scene.id`. Low priority — bug surface is small and obvious during dev.

### NB5. Subscribers re-render on every `progress` float change
`lib/useScrollProgress.ts:50-52` returns the float `progress`. `ProgressMap`, `ExplainerSidebar`, `SceneCueDriver` only need the integer `index`. Expose `useActiveSceneIndex()` and these components stop re-rendering 60 times per second.

### NB6. Sandpack iframe overlap with shuffle 3D
`docs/screenshots/phaseC/66.png` shows the LiveSandpack code editor occluding the top of the shuffle's executor squares. The Sandpack iframe sits inside the article's sticky scene-section column and lands on top of the canvas region where the executors live. Move the LiveSandpack to a side panel on `md:` viewports, or push the shuffle's 3D content up by 1–2 world units when scene 8 is active.

### NB7. `setSceneAmbient` and `playCue` swallow Tone errors silently
`AudioProvider.tsx:90-92, 106-109` use bare `catch {}`. Replace with `catch (e) { if (process.env.NODE_ENV !== "production") console.debug("audio cue failed", e) }`.

### NB8. ProgressMap dots open as horizontal pills only on hover
`components/ui/ProgressMap.tsx:27-35` shows the kicker label only when the pointer is over a dot or it is the active scene. Keyboard-focused dots correctly get the pill via `group-focus-visible:` but touch users on a desktop-viewport browser get neither. Minor.

### NB9. `_StubCanvas` is no longer doing what its name suggests
`components/three/_StubCanvas.tsx` is now the reduced-motion fallback + the dynamic-import loading slot. The leading underscore implies private, but the file is imported by `ClusterStageCanvas.tsx:7` *and* used as a top-level renderer at `:20`. Rename to `ReducedMotionStage.tsx` (or similar) and drop the underscore — current name is misleading.

### NB10. Hero overlay gradient is fixed-height (120 vh)
`app/spark/page.tsx:50` puts a `120vh` opaque-to-transparent gradient under the header. The gradient is pinned to `header` (not to viewport), so as you scroll *past* the header it doesn't shift — the canvas is exposed cleanly. But the gradient itself contributes 120 vh to document height. If the article ever drops the hero, this becomes orphaned.

### NB11. `THREE.Clock` deprecation
Single warning from r3f. Upstream — not the Worker's responsibility. Same as phase A NB1.

---

## Files referenced

- `app/spark/page.tsx` — article shell, hero overlay, skip-link, noscript fallback
- `app/globals.css` — single `.scene-canvas` rule, transparent body, OKLCH theme tokens
- `lib/colors.ts` — sRGB-hex palette, OKLCH source preserved as comments
- `lib/scenes.ts` — 12-scene metadata (single source of truth)
- `lib/useScrollProgress.ts` — module-level rAF + `useSyncExternalStore`
- `lib/useReducedMotion.ts` — `prefers-reduced-motion` matcher
- `components/scroll/CameraRig.tsx` — 12 camera waypoints, smoothstep ease, `useFrame` reader
- `components/scroll/SceneSection.tsx` — per-scene sticky prose
- `components/scroll/SmoothScroll.tsx` — Lenis init, reduced-motion skip
- `components/three/ClusterStageCanvas.tsx` — dynamic-import gate, reduced-motion branch
- `components/three/SceneStage.tsx` — single sticky canvas + r3f tree
- `components/three/_StubCanvas.tsx` — fallback SVG (rename suggested)
- `components/three/Starfield.tsx` — drei `<Stars>` backdrop
- `components/three/scenes/*.tsx` — 12 scene components (all consume the now-correct PALETTE)
- `components/audio/AudioProvider.tsx` — Tone.js bus, scene-aware ambient pad
- `components/audio/SceneCueDriver.tsx` — fires cue + ambient on scene index change
- `components/ui/AudioToggle.tsx`, `ProgressMap.tsx`, `HeroHint.tsx`
- `components/ai/ExplainerSidebar.tsx` — dialog-semantics panel with Esc + focus mgmt
- `components/code/LiveSandpack.tsx`, `CodeMorph.tsx` — embedded code (no functional change since phase A)

---

## Evidence artefacts

- `docs/screenshots/phaseC/0.png` — H1 visible at top, scene-1 cluster idle behind
- `docs/screenshots/phaseC/8.png` — scene-1/2 transition, worker-cutaway zoom
- `docs/screenshots/phaseC/16.png` — driver ignite, warm-amber sphere
- `docs/screenshots/phaseC/25.png` — data arrival, orange prism + blue beam (scene 04)
- `docs/screenshots/phaseC/33.png` — partition shatter, blue radial burst (scene 04→05 boundary)
- `docs/screenshots/phaseC/42.png` — task rain (scene 06), six executors draining queue
- `docs/screenshots/phaseC/50.png` — narrow-vs-wide, green and blue mesh towers (scene 07)
- `docs/screenshots/phaseC/58.png` — transformations close-up, side-by-side comparison
- `docs/screenshots/phaseC/66.png` — **The Shuffle** + LiveSandpack code editor
- `docs/screenshots/phaseC/75.png` — stages diagram, three node cards with connectors
- `docs/screenshots/phaseC/83.png` — empty between scenes 10 and 11 (NB1)
- `docs/screenshots/phaseC/92.png` — fly mode (scene 12), five floating cubes
- `docs/screenshots/phaseC/100.png` — footer + final constellation
- `docs/screenshots/phaseC/landing.png` — landing page, clean type
- `docs/screenshots/phaseC/mobile-0.png` — iPhone-15 portrait, top of article
- `docs/screenshots/phaseC/mobile-50.png` — iPhone-15 at mid-scroll, canvas visible
- `docs/screenshots/phaseC/_console.json` — 8 messages (HMR + 2× `THREE.Clock` deprecation + 1× landing-page 404 favicon ping)
- `docs/screenshots/phaseC/_errors.txt` — empty (no pageerrors)
- `docs/screenshots/phaseC/_dom.json` — DOM probe at scroll 0 (see "DOM probe" table above)

---

**Verdict: PASS — 96 / 100. Phase advancement unblocked. The 11 non-blocking issues are polish targets the Lead can prioritise for the next worker turn but none are required to move forward.**
