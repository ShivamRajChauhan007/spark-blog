# Critic report — phase A, iteration 1

- **Date:** 2026-05-17
- **Phases under review:** 0 → 6 (scaffold, 12 scenes, Sandpack, Shiki magic-move, AudioProvider, ExplainerSidebar)
- **Dev server:** `http://localhost:3737`
- **Verdict:** **FAIL** — total **41 / 100** (need ≥95)
- **Screenshots:** `docs/screenshots/phaseA/{0,15,30,45,60,75,90,100,landing,mobile-0,mobile-50}.png`
- **Tool note:** The `agent-browser` skill could not finish installing (`generic.ci.artifacts.walmart.com` was unreachable for the Chromium download). Fell back to driving the locally-cached Playwright Chromium (`~/Library/Caches/ms-playwright/chromium-1223`) directly via `playwright-core` — same engine, same screenshots, just bypassed the wrapper. All scroll positions and viewports were captured. Console + pageerror logs at `docs/screenshots/phaseA/_console.json` and `_errors.txt`.

---

## Executive summary

The build compiles and the type-checker is clean, but visually the article is **broken on desktop**. Across scroll positions 0%, 15%, 30%, 45%, 60% the viewport is **completely empty** except for the audio toggle, the Next.js dev indicator, and the "explain this" button. Only at ~75% does the first sliver of prose appear, and only at 90%+ does a proper scene render. The 3D canvas is **never visible** on desktop. Mobile is conversely fine — the scene prose renders correctly at 50% scroll — because the screen real-estate hides the bug. Two structural defects explain almost everything: (1) two `position: sticky` canvas wrappers reserve 100 vh each in the document flow, pushing the entire `<header>` 1800 px below the fold, and (2) the canvas tree carries `-z-10` against an opaque body background so the 3D paints behind the page. On top of those, every `THREE.Color("oklch(...)")` in `lib/colors.ts` silently fails to parse, so all 3D materials default to white — defeating the per-scene OKLCH palette goal entirely.

---

## Rubric

| Category | Score | Reasoning |
|---|---|---|
| Build & lint clean (15) | **15 / 15** | `npm run build` succeeds in 3.1 s on Turbopack, 4 static routes, no TS errors, no warnings. `tsc --noEmit` (the lint script) is clean. |
| No console errors (10) | **3 / 10** | No `pageerror`s, but 26 console warnings: 13× `THREE.Color: Unknown color model oklch(...)` (every palette entry), `THREE.Clock: deprecated, use THREE.Timer`, plus a Sandpack `requestfailed` to `2-19-8-sandpack.codesandbox.io` (offline iframe boot). The OKLCH warnings are not noise — they prove the entire 3D palette is silently broken. |
| Scene completeness (15) | **2 / 15** | 12 sections render in the DOM, but on desktop the prose is invisible until ~75% scroll. The page reports `document.scrollHeight = 24,224 px` while the `<h1>` lives at `y = 1968 px` and the first `<h2>` at `y = 2871 px` — meaning the first ~2,000 px of the page is dead space that the reader sees as a black void. Only the right-rail kicker pill ("01 · THE CLUSTER" at 75%, "12 · FLY MODE" at 90%) hints that scenes exist. 3D never renders to the visible viewport. The mobile run at scroll y=11,112 *does* show scene 06 prose clearly, confirming the prose markup itself is fine and the bug is desktop-only layout. |
| The Shuffle (15) | **0 / 15** | Cannot be evaluated visually because the canvas is occluded (see canvas `-z-10` bug). Code-wise `ShuffleScene.tsx` uses one `InstancedMesh` with 96 rows, Catmull-Rom curves, staggered start windows — the geometry is right. But on screen the user sees nothing arcing. No audio cue plays unless the user enables audio (correct default) but the cue map only fires on transition (`SceneCueDriver.tsx`), and the scene index transition happens regardless of whether the scene is visible. Mobile-OK is moot — same canvas bug applies. |
| Performance (10) | **2 / 10** | Three independent `useScrollProgress()` hooks (in `ProgressMap`, `ExplainerSidebar`, `SceneStage`) each run their own `requestAnimationFrame` setState loop → three full React re-renders per frame, plus the `SceneCueDriver` useEffect that depends on `progress` re-runs every frame too. `InstancedMesh` is correctly used in `ShuffleScene` (96), `TaskRain`, `NarrowVsWide`, `PartitionShatter`. `EffectComposer` with `multisampling={4}` + Bloom (mipmapBlur) + Vignette is heavy for a constantly-rendering canvas, especially because it renders even when invisible. |
| Accessibility (10) | **5 / 10** | Good: a `sr-only` skip-link, `role="main"`, `aria-label` on AudioToggle / ProgressMap / ExplainerSidebar nav, `aria-pressed`, `aria-current`, reduced-motion branch in `ClusterStageCanvas` (falls back to `StubCanvas`), Lenis disabled when `prefers-reduced-motion`. Bad: header H1 is not actually reachable by keyboard within a normal scroll window because it sits 1800 px down; no semantic landmark for the right-rail progress dots beyond `nav[aria-label]`; ExplainerSidebar opens a div that is **not focusable** and has no `role="dialog"` or focus management; the canvas `aria-hidden` is correct but the Fly-mode (scene 12) takes pointer events without any keyboard hint or instructions exposed to AT users. |
| Code quality (10) | **5 / 10** | Strict TS, almost no `any` (one `eslint-disable @typescript-eslint/no-explicit-any` in `SceneStage.tsx:72` for the dynamic scene-renderer cast — justified but ugly), single-purpose components mostly. Issues: `lib/colors.ts` is *load-bearing wrong* (see below), duplicate `useScrollProgress` consumers, unused `_progress` props on most scene components (camera moves but scenes themselves don't morph internally), magic numbers without constants, no shared state for scroll progress, `_StubCanvas.tsx` is dead code once the dynamic SceneStage loads (rendered as a sibling). |
| Audio polish (5) | **3 / 5** | Off-by-default ✓, ARIA-correct toggle ✓, lazy-loads Tone.js ✓ (~80 KB saved on first paint), proper dispose-on-unmount ✓. But: `setSceneAmbient` is a no-op (`// Phase 5: vary ambient pad pitch per scene`), so there is no ambient bed at all — only one-shots fire on scene change, leaving long silences. The `playCue` `try { ... } catch {}` swallow makes failures invisible. |
| Visual polish (5) | **1 / 5** | Typography (Instrument Serif + Geist Mono + Inter) loads from Google Fonts correctly and the landing page proves the type is beautiful. But the article body is invisible at 5 of 8 sampled scroll positions, the right-rail progress map is over-quiet (1.5-px dots at 25% bg-line opacity disappear into the background), and the OKLCH-per-scene tinting goal is dead because `THREE.Color("oklch(...)")` doesn't parse. |
| Mobile (5) | **5 / 5** | iPhone-15 viewport (375×812) at 50% scroll cleanly shows scene 06 "Tasks, in parallel." with kicker, title, body, italic quote — no overflow, type scales correctly via `globals.css` `@media (max-width: 640px)` clamp rules. The `md:flex` gating hides the desktop-only ProgressMap and ExplainerSidebar trigger, which is the right call. (Ironically mobile looks better than desktop right now.) |
| **TOTAL** | **41 / 100** | |

---

## Blocking issues — must fix before phase advance

### B1. Article body is invisible on desktop for the first ~75 % of scroll
**File: `components/three/SceneStage.tsx:50`, `components/three/_StubCanvas.tsx:9`, `app/globals.css:44`**

Two siblings render `<div className="scene-canvas">` (one for `StubCanvas`, one for the real `SceneStage`). `.scene-canvas` is defined as:

```css
.scene-canvas { position: sticky; top: 0; height: 100vh; }
```

`position: sticky` **does not remove the element from document flow** — each one reserves 100 vh of vertical space. With both rendered as siblings of `<header>` (see `app/spark/page.tsx:23-24`), they push the header down by **2 × 100 vh = 1800 px** on a 900-px viewport. The DOM inspection confirms `<header>` is at `y = 1800 px`, `<h1>` at `y = 1968 px`. The viewport at scroll 0 sees only the empty top of those sticky boxes.

Fix direction (do not implement — Critic does not write code): either (a) render only one canvas wrapper and use `position: fixed` (since the inner `Canvas` already forces `!fixed !inset-0` via className), or (b) move the canvas mount above the article into a fixed full-bleed wrapper with `position: fixed; inset: 0; z-index: -1`. Then make `<ClusterStageCanvas>` return a single child element (not StubCanvas *and* SceneStage as siblings).

### B2. 3D canvas is painted behind the body background, so the user never sees it
**File: `components/three/SceneStage.tsx:50`, `components/three/_StubCanvas.tsx:9`, `app/globals.css:24`**

The canvas wrapper has `-z-10` (Tailwind = `z-index: -10`). The body inherits an opaque background (`html { background: var(--color-bg) }` + `body.bg-grain { background-color: var(--color-bg); ... }`). A child with `z-index: -10` paints **below** the html background in the stacking context, so the canvas is invisible. The screenshots confirm: solid `#0c0e14`-ish color across the whole canvas region even though the `<canvas>` element exists with `width=1440 height=900`.

Fix direction: drop the `-z-10`, make the canvas wrapper `fixed inset-0 z-0`, and make the prose containers `relative z-10` so they stack above. The body background must be **transparent** so the canvas shows through.

### B3. `THREE.Color("oklch(...)")` is unsupported — every 3D color is the default
**File: `lib/colors.ts:6-26` (every entry), warnings at `docs/screenshots/phaseA/_console.json` lines 22-72**

`new THREE.Color(string)` accepts named colors, hex, `rgb()`, `hsl()`. **It does not accept `oklch()`.** Every `PALETTE.*` and `WORKER_TINTS[*]` is silently constructed with the default `#ffffff`. This means scenes 1–12 render in flat white instead of the warm-amber / cool-azure tinting the design calls for, killing the per-scene palette goal stated in `AGENTS.md`. Affects every scene component (greps show `PALETTE.accent`, `PALETTE.accent2`, `PALETTE.fgMuted`, `WORKER_TINTS[i]` consumed in `ClusterIdle`, `DriverIgnite`, `DataArrival`, `PartitionShatter`, `TaskRain`, `NarrowVsWide`, `ShuffleScene`, `StagesDiagram`, `AirflowDag`, `EphemeralCycle`, `FreeCamera`).

Fix direction: convert each OKLCH token to sRGB (or use Three's `Color.setStyle("oklch(...)")` polyfill if a converter is added). Practically — compute the sRGB hex at design-time and hard-code, or use the `culori` library at module init. Three.js does support `Color.setRGB(r,g,b)` and Three r152+ has `ColorManagement` but no OKLCH parser.

### B4. `useScrollProgress` runs three independent rAF loops, each calling `setState` every frame
**File: `lib/useScrollProgress.ts:13-21`, consumers in `components/ui/ProgressMap.tsx:11`, `components/ai/ExplainerSidebar.tsx:13`, `components/three/SceneStage.tsx:37`, `components/audio/SceneCueDriver.tsx:29`**

Four call sites × 60 fps = **240 React state updates per second** during scroll, triggering re-renders in heavy trees (Sandpack iframe parent, sidebar, full canvas tree). This is the single biggest perf hazard.

Fix direction: hoist scroll progress into a Zustand store (or a `useSyncExternalStore` with a module-level rAF) so all consumers subscribe to one source. Or expose `progressRef` and consume via `useFrame` inside the canvas without re-rendering React.

### B5. Header H1 never appears in the natural reading position
**File: `app/spark/page.tsx:40-50`**

Consequence of B1, but worth calling out separately: an explainer article whose hero headline is below the fold on page load is a category failure. The reader scrolls into an empty void and assumes the page is broken (visible in the 0–60 % screenshots). The "scroll to begin" hint at `components/ui/HeroHint.tsx` is visible at first, but with nothing to scroll *to* in the immediate viewport it produces uncertainty.

### B6. Cannot evaluate The Shuffle visually — blocked by B1+B2
The 15-point centerpiece category is currently unscorable. Once B1 + B2 are fixed, re-screenshot at the scene-08 scroll range (between y = 12,600 px and y = 14,400 px on the current layout) to verify arcs render, colors morph, instanced mesh updates work, and the audio `chord` cue fires.

---

## Non-blocking issues

### NB1. `THREE.Clock` deprecation
Single warning from r3f / drei using the old `THREE.Clock`. Upstream — wait for r3f to migrate to `THREE.Timer`.

### NB2. Sandpack offline-boot warning
`https://2-19-8-sandpack.codesandbox.io/ net::ERR_ABORTED` — Sandpack tries to ping a CDN that this network blocks. The editor still renders. Acceptable for now; if shipping offline, swap to a self-hosted bundler.

### NB3. `setSceneAmbient` is a no-op
**File: `components/audio/AudioProvider.tsx:75-82`** — comment says "Phase 5: vary ambient pad pitch per scene" but nothing happens. With audio enabled the article has long silences between cue triggers. Either implement a quiet ambient bed or remove the call site until Phase 5.

### NB4. `_StubCanvas` renders as a sibling of `SceneStage` even when 3D is enabled
**File: `components/three/ClusterStageCanvas.tsx:22-26`** — comment says "SVG renders behind the canvas for the loading moment and on canvas errors," but with both `position: sticky height: 100vh` they double-stack and contribute to B1. If the goal is loading-fallback, use the `loading` slot of `next/dynamic` instead of a sibling.

### NB5. ExplainerSidebar is not a proper dialog
**File: `components/ai/ExplainerSidebar.tsx:31-41`** — opening reveals a panel with no `role="dialog"`, no focus management, no Esc-to-close. Trap focus or annotate as a non-modal popover.

### NB6. `WorkerCutaway` reports `range: [0, 2]` but `ClusterIdle` reports `range: [0, 1]`
**File: `components/three/SceneStage.tsx:22-23`** — overlapping ranges between adjacent scenes are intentional for crossfades, but with `range: [0,2]` and `range: [0,1]`, scene 1 (`ClusterIdle`) and scene 2 (`WorkerCutaway`) both render at scroll start, layered on top of each other. Verify the visual crossfade reads cleanly once B1/B2 unblock visibility.

### NB7. ProgressMap dots are nearly invisible at rest
**File: `components/ui/ProgressMap.tsx:37`** — inactive dots are `w-1.5 h-1.5 bg-[var(--color-line)]`. `--color-line` is `oklch(0.28 0.012 252)` against `--color-bg = oklch(0.14 0.013 252)` — about 1.2:1 contrast. The dots are basically ghost-rendered. Bumping to `--color-fg-muted` at 40 % opacity would help.

### NB8. Audio toggle wins all attention on a blank page
**File: `app/spark/page.tsx:33-35`** — because the page is empty above the fold, the "♪ OFF" pill becomes the entire visual page weight, looking like a UI fragment without context. Will resolve once B1 is fixed and the H1 appears at top.

### NB9. CodeMorph uses `shiki-magic-move` with `theme: "github-dark"` but app theme is custom OKLCH
**File: `components/code/CodeMorph.tsx:89`** — small inconsistency: Sandpack uses a custom OKLCH theme, the magic-move card uses stock github-dark. Could be intentional (clarity wins over brand consistency for code), but worth a design call.

### NB10. `Math.floor(1.0 / span)` edge case in `activeScene`
**File: `lib/useScrollProgress.ts:35`** — clamp is correct (`Math.min(sceneCount - 1, ...)`) so the off-by-one at progress = 1.0 is safe, but `local` will compute to 1.0 at exactly that boundary, then to slightly negative if progress dips below `idx*span` on overshoot. CameraRig's `local * local * (3 - 2*local)` handles 0..1 only; consider clamping `local`.

### NB11. `_progress` parameter ignored in `ClusterIdle` (and almost every scene)
**File: `components/three/scenes/ClusterIdle.tsx:18`** — leading underscore is the convention for "deliberately unused," but the camera rig is the *only* thing that animates with scroll. Scenes themselves are static loops (`group.rotation.y += dt * 0.08`). For 12 scroll-driven scenelets, internal morphs tied to `progress` (rotation tracking, scale-up, color shift) would dramatically lift Scene completeness.

---

## What to fix first for the next iteration

The minimum set to unblock visual review:

1. **B1 + B2** in one go — fix the canvas mounting strategy so the page reads top-to-bottom with header at scroll y=0 and the 3D canvas sitting behind the prose.
2. **B3** — replace OKLCH `THREE.Color` construction with hex/sRGB so the palette actually applies.
3. Re-screenshot and re-run this critic. Once visible, B6 (Shuffle) can be scored.
4. **B4** can wait until B1/B2/B3 are confirmed visually, but should land before the next critic call to avoid scroll-time jank that the rubric will mark against Performance.

`KNOWN_ISSUES.md` should *not* be appended yet — this is iteration 1, not iteration 3.

---

## Files referenced

- `app/spark/page.tsx` — article shell
- `app/globals.css` — `.scene-canvas` sticky rule, font-loading
- `app/layout.tsx` — body class `bg-grain min-h-screen`
- `lib/colors.ts` — broken OKLCH palette construction
- `lib/scenes.ts` — 12 scene metadata entries (prose is good)
- `lib/useScrollProgress.ts` — rAF loop, `activeScene` mapper
- `components/scroll/SceneSection.tsx` — per-scene prose layout (correct)
- `components/scroll/SmoothScroll.tsx` — Lenis init (correct)
- `components/scroll/CameraRig.tsx` — waypoint interpolator (correct)
- `components/three/ClusterStageCanvas.tsx` — double-mounts StubCanvas + SceneStage
- `components/three/SceneStage.tsx` — `-z-10` + `!fixed !inset-0` conflict
- `components/three/_StubCanvas.tsx` — sticky-flow space-eater
- `components/three/scenes/*.tsx` — 12 scene renderers, all consume broken PALETTE
- `components/ui/{AudioToggle,ProgressMap,HeroHint}.tsx`
- `components/audio/{AudioProvider,SceneCueDriver}.tsx`
- `components/code/{LiveSandpack,CodeMorph}.tsx`
- `components/ai/{ExplainerSidebar,stubExplanations}.tsx`

---

## Evidence artefacts

- `docs/screenshots/phaseA/0.png` — empty page at scroll top (1440×900)
- `docs/screenshots/phaseA/15.png`, `30.png`, `45.png`, `60.png` — all visually empty
- `docs/screenshots/phaseA/75.png` — first prose appears (scene-09 italic quote, kicker shows "01 · THE CLUSTER")
- `docs/screenshots/phaseA/90.png` — scene-12 "Your cluster, your camera" renders
- `docs/screenshots/phaseA/100.png` — footer "end of the article"
- `docs/screenshots/phaseA/landing.png` — landing page `/` looks great
- `docs/screenshots/phaseA/mobile-0.png` — mobile top, also blank above the fold but the gap is shorter
- `docs/screenshots/phaseA/mobile-50.png` — scene 06 renders perfectly on mobile, proving the prose path is fine
- `docs/screenshots/phaseA/_console.json` — 71 console messages incl. 26 THREE.Color OKLCH warnings
- `docs/screenshots/phaseA/_errors.txt` — empty (no thrown pageerrors)
- `docs/screenshots/phaseA/_dims.json` — `desktop.scrollHeight = 24224`, `mobile.scrollHeight = 22224`

---

**Verdict: FAIL — 41 / 100. Do not advance to Phase 7. Next Worker turn must address B1–B5; B6 will be re-scored once the canvas is visible.**
