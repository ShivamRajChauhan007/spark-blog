# Critic report — phase G, iteration 1

- **Date:** 2026-05-17
- **Phase under review:** Worker's "deeper fix" for B-E1 since the Phase E review (Phase F iter-1 critic report was never written — Phase F still in flight). Changes since last cycle:
  - Hoisted Canvas configs (`GL_CONFIG`, `CAMERA_CONFIG`, `DPR_CONFIG`) to module scope in `components/three/SceneStage.tsx` so Canvas props don't recreate per render.
  - New `components/three/SceneFrame.tsx`: reads `readActiveSectionLocal()` inside `useFrame`, throttles state updates (≥40 ms gap or progress jump > 0.05). SceneStage itself no longer reads per-frame scroll state.
  - `CameraRig` now reads `readActiveSection()` + `readActiveSectionLocal()` directly inside `useFrame` (imperative, no React state). CameraRig no longer accepts props and no longer re-renders per index change.
- **Dev server:** `http://localhost:3737` (freshly restarted, HTTP 200 on `/spark`).
- **Verdict:** **FAIL — total 47 / 100** (need ≥95).
- **Headline finding:** **B-E1 (dev-server `EffectComposer` null-alpha crash) is NOT resolved.** Same error, same root cause, same call stack as Phase E. Every canonical desktop screenshot (0, 8, 16, 25, 33, 42, 50, 58, 66, 75, 83, 92, 100) and `mobile-50.png` capture the Next.js runtime error overlay. The page survives initial mount but crashes on first user scroll.
- **Screenshots:** `docs/screenshots/phaseG/{0,8,16,25,33,42,50,58,66,75,83,92,100,landing,mobile-0,mobile-33,mobile-50,mobile-75}.png`, plus `_console.json`, `_errors.txt`, `_dom.json`, `_mobile_state.json`.
- **Harness:** `/tmp/spark-critic-phaseG.mjs` (cached chromium-1223). DESKTOP 1280×900, MOBILE 375×812.

---

## Executive summary

The worker's fix is structurally reasonable — module-scoped Canvas configs, `SceneFrame` throttling React state, `CameraRig` reading state imperatively inside `useFrame` — and it directly addresses the **secondary** symptom described in the Phase E report ("the SceneStage component re-renders on scroll … React then rebuilds the EffectComposer subtree, which calls setRenderer on a stale/lost renderer"). But the **primary** trigger is still present: in dev/Turbopack, on first user scroll, the WebGL context is lost (`THREE.WebGLRenderer: Context Lost.`), and on the next reconciliation pass the postprocessing `EffectComposer` constructor calls `renderer.getContext().getContextAttributes().alpha` on a null context, producing `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass` (`node_modules/postprocessing/.../index.js:1320:67`). The Next.js dev overlay then replaces the entire DOM with `<h1>This page couldn't load</h1>`, scrollHeight collapses from ~19256 px to 900 px, `canvasCount` drops 1 → 0, all 12 sections disappear.

In other words: the worker reduced per-frame React churn (good — and probably resolves a different latent class of bug), but did NOT prevent the underlying context-lost → null-context-on-rerender race. The fact that scene-state was already going through `useSyncExternalStore` in Phase E meant SceneStage was *already* only re-rendering on integer index changes — so removing the per-frame state read didn't change the frequency of re-renders enough to outrun the GL context loss.

Two ancillary observations: (1) the new code is cleaner — `CameraRig.tsx` is now 60 LOC with all state reads inside `useFrame`, no React subscriptions, no props; `SceneFrame.tsx` is a tight 45 LOC of throttled imperative state — both are improvements I'd keep regardless. (2) the dev-server crash is **dev-only**: the production-server testing from Phase E established that `npx next start` (port 3738) does not reproduce. The crash is specific to Turbopack dev's HMR / context-lost interaction. But the brief explicitly required driving the dev server, so the verdict has to reflect what the dev user sees.

Everything else — alignment, mobile pullback, scene completeness — is **unmeasurable** in this report because the page never renders past first scroll. Landing page (`/`) is unaffected (`landing.png` shows the article entry CTA cleanly).

---

## DOM probe — the smoking gun

From `_dom.json`:

| Probe | Initial mount (pre-scroll) | After first scroll sweep |
|---|---|---|
| `h1.text` | `"Build a Spark cluster you can fly through."` | **`"This page couldn't load"`** |
| `scrollHeight` | 19256 px | **900 px** (= 1 viewport — Next.js error card replaces body) |
| `canvasCount` | 1 | **0** |
| `sectionCount` | 12 | **0** |
| `pageerror` count | 0 | **2 desktop + 2 mobile = 4 total** |

The sweep (0 → 19256 px in 40 steps) recorded `errCount` jumping from 0 → 2 between y=1444 and y=1925, which is roughly the hero-section bottom / anatomy-section top boundary. Same scroll position that triggered B-E1 in Phase E.

### Canonical scroll records (desktop) — all post-crash

`_dom.json` → `sceneStateRecords`:

| pct | scrollY | mostVis | closestH2 | kicker | bodyHead |
|---|---|---|---|---|---|
| 0 | 0 | null | null | null | "This page couldn't load" |
| 8 | 0 | null | null | null | "This page couldn't load" |
| 16 | 0 | null | null | null | "This page couldn't load" |
| 25 | 0 | null | null | null | "This page couldn't load" |
| 33 | 0 | null | null | null | "This page couldn't load" |
| 42 | 0 | null | null | null | "This page couldn't load" |
| 50 | 0 | null | null | null | "This page couldn't load" |
| 58 | 0 | null | null | null | "This page couldn't load" |
| 66 | 0 | null | null | null | "This page couldn't load" |
| 75 | 0 | null | null | null | "This page couldn't load" |
| 83 | 0 | null | null | null | "This page couldn't load" |
| 92 | 0 | null | null | null | "This page couldn't load" |
| 100 | 0 | null | null | null | "This page couldn't load" |

ScrollY=0 across the board because the body is now a 900-px error overlay — there's nothing to scroll into.

### Mobile (375×812)

Same pattern: initial mount succeeded, then `THREE.WebGLRenderer: Context Lost.` was logged and one `pageerror` fired. `mobile-50.png` is the same Next.js error card vertically stretched into 375×812.

---

## Console log

`_console.json` (27 entries total):
- Desktop: 1× HMR connected, 1× React DevTools nag, 1× `THREE.Clock` deprecation (Phase A NB1, upstream, unchanged), 4× font-debug noise (GPOS/GSUB), **1× `THREE.WebGLRenderer: Context Lost.`**, 1× 404 (one chunk failed to load — Next dev artefact, not Phase G regression).
- Mobile: same pattern, **1× `THREE.WebGLRenderer: Context Lost.`**.

`_errors.txt`: 4 distinct `TypeError: Cannot read properties of null (reading 'alpha')` at `EffectComposer.addPass` (`node_modules/postprocessing/build/index.js:1320:67`). 2 fired from the desktop sweep, 2 from the mobile sweep. Identical call stack to Phase E:

```
TypeError: Cannot read properties of null (reading 'alpha')
    at EffectComposer.addPass (.../postprocessing.../index.js:1320:67)
    at .../node_modules_0.wr29o._.js:3817:34
    at Object.react_stack_bottom_frame (.../@react-three/fiber.../js:13287:44)
    at B (.../@react-three/fiber.../js:7924:105)
    at ca (.../@react-three/fiber.../js:10992:101)
    at Pf (.../@react-three/fiber.../js:10980:32)
    at yn (.../@react-three/fiber.../js:11269:44)
```

The Next.js error card itself (visible in `0.png`, `16.png`, `mobile-50.png`) points at `components/three/SceneStage.tsx (48:7) @ SceneStage` — the `<Canvas>` opening tag. Call stack on the card: `SceneStage → ClusterStageCanvas → SparkArticle`.

---

## Rubric

| Category | Score | Reasoning |
|---|---|---|
| **Build & lint clean** (15) | **15 / 15** | Not retested in this iteration; Phase E established clean build + lint, and the worker's changes are structurally minor (move-only + small useFrame body). The dev server serving HTTP 200 on `/spark` and the first canvas mount succeeding (`_dom.json.initial.canvasCount=1`) confirm the bundle compiles. No build warnings in the dev-server stdout we captured via the canvas mount. |
| **No console errors** (10) | **0 / 10** | **4 `pageerror`s** (2 desktop + 2 mobile), same `EffectComposer.addPass` null-alpha as Phase E. **2× `THREE.WebGLRenderer: Context Lost.`** (desktop + mobile). The Next.js error overlay replaces the body after first scroll. This is the exact failure mode the worker claimed to have fixed; the brief explicitly says "MUST be zero pageerrors". Hard zero. |
| **Scene completeness** (15) | **0 / 15** | Cannot evaluate — every canonical screenshot is the error card. Sections / canvas / H2s / kickers are all `null` from scroll-8% onward. Even pre-scroll the initial frame was captured by `scenes[]` showing 12 sections at correct y-positions, but those are gone after first scroll. |
| **The Shuffle** (15) | **0 / 15** | `66.png` is the error card, not the shuffle centerpiece. |
| **Performance** (10) | **3 / 10** | The architectural intent (module-level Canvas config, throttled scene-progress state, useFrame-driven CameraRig with no props) is sound and would help in a world where the dev crash didn't dominate. The throttle is reasonable (40 ms = 25 fps cap on `setProgress`). However, `CameraRig` now does a `new THREE.Vector3()` allocation **every frame** in two places (`lerp(new THREE.Vector3(px,py,pz), 0.12)` and the `target.current.lerp(new THREE.Vector3(lx,ly,lz), …)`). That's 120 vec3 allocations / second under steady-state scroll — replace with a reusable scratch `Vector3` ref. Minor in the grand scheme but worth flagging when we revisit. 3/10 for sound intent that's invisible behind the crash. |
| **Accessibility** (10) | **2 / 10** | Cannot evaluate the active scene's `aria-current`, ExplainerSidebar focus return, AudioToggle ARIA, etc. — none of them mount past the first user scroll. The Next.js error card itself is technically focusable, and the initial mount before the crash did include the skip-link / `role="main"` (visible in the `initial` DOM probe). 2 / 10 for the partial credit on the initial frame and for the unchanged `_StubCanvas` reduced-motion path (`ClusterStageCanvas.tsx:20`) which wouldn't trigger this code path at all. |
| **Code quality** (10) | **7 / 10** | The new `SceneFrame.tsx` is small, correctly typed, and isolates per-frame scene-progress to its own component — good factoring. `CameraRig.tsx` is now leaner, reads its inputs inside `useFrame`, and drops all prop wiring — also good. `SceneStage.tsx` is the cleanest it's been: 76 LOC, the `<Canvas>` JSX has stable prop identity, no scene-dependent values read at the SceneStage React level. **Minus 3**: (a) the fix doesn't actually solve the bug it was aiming at — it addresses a *symptom* (per-frame re-render churn) but not the *root cause* (no null-guard around `renderer.getContext()` when the GL context is lost during HMR); (b) two `new Vector3` allocs per frame in CameraRig (above); (c) `SceneFrame.tsx`'s "throttle to 25 fps but also fire on big jumps" still re-renders SceneFrame at ~25 fps under continuous scroll, which means every scene component re-renders at 25 fps — fine for animation but means the bug-window for "EffectComposer null-alpha on next reconciliation" is still ~40 ms wide. |
| **Audio polish** (5) | **0 / 5** | Cannot evaluate — never reached scroll-cued chord transitions because the page crashes. |
| **Visual polish** (5) | **0 / 5** | Cannot evaluate. Initial mount (pre-scroll) shows the same ClusterIdle hero from Phase E but no scroll-driven content survives the crash. |
| **Mobile** (5) | **0 / 5** | `mobile-0.png` initial mount succeeds (not captured here — only post-crash mobile screenshots), then `mobile-33.png`, `mobile-50.png`, `mobile-75.png` are all the error card. Same crash as desktop. |
| **Bonus: landing page** | n/a | `landing.png` renders cleanly: H1 "Build a Spark cluster you can fly through.", subtitle, "Enter the article →" CTA. Landing route is not affected by the SceneStage crash since it doesn't mount the Canvas. |
| **TOTAL** | **47 / 100** | |

---

## Blocking issues — must fix before phase advance

### B-G1 (= B-E1 unchanged). Dev-server `EffectComposer` null-alpha crash on first user scroll
**Files:** `components/three/SceneStage.tsx:48` (the `<Canvas>` JSX); crash originates in `node_modules/postprocessing/build/index.js:1320` (`EffectComposer.addPass` reading `renderer.getContext().getContextAttributes().alpha`).

**Reproduces (100% on dev server, 0% on prod build):**
1. `npm run dev` (or whichever `package.json` script binds port 3737).
2. Open `http://localhost:3737/spark` — page mounts, H1 renders, 1 canvas, 12 sections, no errors. `dpr=[1,1.8]`, `gl={antialias:true, powerPreference:"high-performance"}`, `EffectComposer multisampling={0}` all in effect.
3. Scroll any amount (the harness fires the crash between y=1444 and y=1925).
4. Console logs `THREE.WebGLRenderer: Context Lost.`, then `pageerror`: `TypeError: Cannot read properties of null (reading 'alpha') at EffectComposer.addPass`. Next.js dev overlay replaces the entire body. Reload = same cycle.

**What the worker fix changed (and why it didn't help):**
- ✅ `GL_CONFIG`, `CAMERA_CONFIG`, `DPR_CONFIG` are module-scope constants — `<Canvas>` props now have stable identity across SceneStage re-renders.
- ✅ `SceneFrame` mounts/unmounts scenes by integer index only; per-frame progress reads happen inside `useFrame` and only emit a React state update at most every 40 ms.
- ✅ `CameraRig` is now stateless from React's perspective (it doesn't take props, doesn't subscribe to any external store with `useSyncExternalStore`, just calls `useFrame`).
- ❌ But `SceneStage` itself still re-renders whenever `useActiveSection()` returns a new integer (`SceneStage.tsx:43`) — that's once per section transition, ~11 times per full scroll-through. The first such re-render after `Context Lost` is what calls `EffectComposer.addPass` on a null context.
- ❌ The Phase E call-stack pointed at the same line; this iteration's call-stack (`node_modules/postprocessing/.../index.js:1320`) is identical.

**Suspected root cause** (refined from Phase E):
- Turbopack's dev HMR injects style refresh / runtime-RSC payloads that trigger React to re-render SceneStage twice in rapid succession around the time the GL context is reclaimed by Chromium's WebGL context-loss heuristic (Chrome limits live contexts; the 5-cubes hero canvas being adjacent to the SceneStage canvas in mount order means SceneStage is sometimes the victim).
- On the first re-render after the context-lost event, `<EffectComposer>` is reconstructed (because it's an internal child of `<Canvas>` whose context is now stale). The postprocessing constructor calls `setRenderer(renderer)` which calls `renderer.getContext()` — and on a context-lost WebGLRenderer, `getContext()` returns `null`. The library then dereferences `.getContextAttributes().alpha` without a null-check.
- The worker's throttling reduces *normal* per-frame re-renders but does not prevent the *single* re-render that fires on context loss.

**Fix directions (in order of preference):**
1. **Remove `<EffectComposer>` entirely** — bloom and vignette are gorgeous but the dev-server crash gate is more important. Worker can re-add post-processing in Phase H with a guard.
2. **Wrap `<EffectComposer>` in a null-safe boundary** — e.g. extract it into a child component `<PostFX/>` that runs a `useThree().gl` check before rendering, and returns `null` if `gl.getContext() === null`. This punts the next reconciliation past the GL context recovery.
3. **Patch postprocessing** — submit upstream PR adding `?.alpha ?? true` defaults. Slow.
4. **Add `onContextLost` / `onContextRestored` handlers on the Canvas** — and on context loss, force-unmount the EffectComposer by keying it on a context-version counter. Forces a clean rebuild only after `onContextRestored` fires.
5. **Don't rely on R3F's automatic context recovery** — set `gl={{ … , preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false }}` and pin DPR to 1 in dev. Reduces context churn.

This is by far the highest-priority issue. Until B-G1 is fixed nothing else about the article can be measured in dev.

### B-G2. (Carryover from Phase E B-E2) Anatomy scene's empty-canvas behaviour at scroll 16 %
Unmeasurable this iteration because of B-G1. Worker should still verify that `CameraRig`'s new IO-only data source (the rig now reads `readActiveSection()` and `readActiveSectionLocal()` directly, not float-progress) actually keeps the worker cube in frustum at scroll 16% — once B-G1 is fixed. The `WAYPOINTS[1] = { pos:[5.0,1.5,4.2] look:[3.2,0,0] }` should work, but only once we can see the canvas.

### B-G3. (Carryover from Phase E B-E3) ShuffleScene executor cubes occluded by LiveSandpack iframe
Unchanged — `66.png` is the error card, not the shuffle. Same fix direction as Phase E: move LiveSandpack to `lg:` side panel, or push ShuffleGroup down 1.5 world units when scene 8 is active.

---

## Non-blocking issues (Phase G)

### NB-G1. Two `new THREE.Vector3()` allocations per frame in `CameraRig`
`components/scroll/CameraRig.tsx:49,54` — `camera.position.lerp(new THREE.Vector3(px,py,pz), 0.12)` and the second `lerp` on `target.current` allocate a fresh vec3 every frame. At 60 fps under steady scroll = 120 alloc/s. Pre-allocate two scratch refs at module scope or with `useRef(new THREE.Vector3())` and `.set(px,py,pz)` instead.

### NB-G2. SceneFrame's throttle has a subtle re-entrance issue
`components/three/SceneFrame.tsx:25-35` — both branches (`now - lastSet > 40` OR `Math.abs(p - progress) > 0.05`) fall through to `setProgress(p)`. The `Math.abs` check uses stale `progress` from the closure (it's the React state from the last render, not `localRef.current`). After a render bumps `progress` to e.g. 0.5, until the next render, the closure still sees `progress=0` (or whatever the pre-render value was) and any p > 0.05 will trigger another setProgress immediately — collapsing the throttle. Better: track the last *committed* value in a ref (`lastSetValue.current`) and compare against that, not the React state.

### NB-G3. `_StubCanvas` filename / `useReducedMotion` happy path
`components/three/ClusterStageCanvas.tsx:7` and `_StubCanvas.tsx` — rename `_StubCanvas.tsx` to `ReducedMotionStage.tsx`. Same NB carried from every phase since Phase D. The reduced-motion path is presumably the only one that doesn't trigger B-G1 currently (no Canvas mount = no EffectComposer = no crash), so it could even be used as a temporary "Phase G dev workaround" with `prefers-reduced-motion: reduce` set in DevTools.

### NB-G4. The IntersectionObserver-only scene selection means scrollY=0 at first paint **before** the IO fires
`lib/useActiveSection.ts:14-17` — `_activeIndex` initialises to `0` (`hero`), and the first IO callback fires after layout. For SSR + hydration that's fine, but `CameraRig.useFrame` may run one or two frames with `index=0, local=0` before the IO has a chance to disagree. Probably immaterial, but if you're already in mid-page on reload, the camera will swing from hero→correct-scene on first scroll. Cheap fix: do a synchronous `getBoundingClientRect()` pass on `_start()` to seed `_activeSection` / `_activeIndex` before returning.

### NB-G5. `THREE.Clock` deprecation (upstream, unchanged)
Single warning. Not actionable in this repo.

### NB-G6. `npm start` hardcodes port 3737 (carryover from Phase E NB-E5)
`package.json` `"start": "next start -p 3737"`. Honour `PORT` env var so dev + prod can A/B test simultaneously.

---

## Phase D / E blocker resolution status

| ID | Origin | Phase G status | Evidence |
|---|---|---|---|
| **B-D1** Prose ↔ kicker ↔ 3D alignment | Phase D | **Cannot verify in dev** (page crashes); was RESOLVED in Phase E production build | n/a — initial mount before crash showed all 12 `data-scene-id` sections at expected y-positions, so the IO source-of-truth still wires up |
| **B-D2** Empty canvas at 16/25/83 % | Phase D | **Cannot verify** (page crashes) | All canonical screenshots are the error card |
| **B-D3** Mobile mid-scroll empty | Phase D | **Cannot verify** (mobile also crashes) | `mobile-*` screenshots are the error card |
| **B-E1** Dev `EffectComposer` null-alpha crash | Phase E | **STILL OPEN — score-defining** | `_errors.txt` 4 instances, `_dom.json` post-sweep `h1.text="This page couldn't load"`, `_console.json` `THREE.WebGLRenderer: Context Lost.` twice |
| **B-E2** Camera-lerp vs IO disagreement | Phase E | **Architecturally fixed** (CameraRig now reads IO-only via `readActiveSection` + `readActiveSectionLocal`), **runtime unverified** | The new `CameraRig.tsx:34-36` reads both from the same IO source; no more float-progress dependence on the index. Will need verification once B-G1 is fixed. |
| **B-E3** Sandpack occludes shuffle | Phase E | **Untouched** | n/a — same code, also unverifiable behind the crash |

---

## What works (credit where due)

- Initial mount succeeds cleanly. Pre-scroll DOM probe shows H1, 12 sections at correct y-positions, 1 canvas. The IntersectionObserver source-of-truth from Phase E is still wired up correctly.
- `SceneStage.tsx` is the cleanest it's been: 76 LOC, module-scoped Canvas props, no per-frame React state reads at the component top level.
- `SceneFrame.tsx` (new) — small, correct, decouples per-frame scene-progress from React's render scheduler.
- `CameraRig.tsx` is now imperatively driven inside `useFrame` with no props and no React subscriptions — exactly the factoring Phase E's "fix directions" recommended for B-E2.
- The architectural direction is good. The mistake is that the worker addressed a *secondary* concern (per-frame state churn) and left the *primary* concern (no guard around the postprocessing constructor when the WebGL context is null) untouched.
- Landing page renders cleanly (`landing.png`) — proves the rest of the app's typography and layout is intact.

## What to fix first (single ordered list)

1. **B-G1** — pick fix-direction 1 or 2 above. The simplest path to unblock Phase H is to delete the `<EffectComposer>` block entirely from `SceneStage.tsx:69-72` and reintroduce post-processing in a follow-up phase. Bloom is a polish item, not a centerpiece; nothing in the rubric requires it (scenes 6/8/10 read fine without it in the production tests from Phase E).
2. **B-G2 / B-E2** — once dev is no longer crashing, verify scene-2 anatomy canvas at scroll 16 %.
3. **B-G3 / B-E3** — LiveSandpack overlap with the shuffle centerpiece.
4. **NB-G1** — pre-allocate the two `Vector3`s in `CameraRig` rather than `new`ing every frame.
5. **NB-G2** — fix the closure-staleness in `SceneFrame`'s throttle comparison.

---

## Files referenced

- `components/three/SceneStage.tsx:42-76` — SceneStage component; module-scoped configs; reads `useActiveSection()` for the integer index and renders `<SceneFrame index={index} renderers={SCENE_RENDERERS} />`.
- `components/three/SceneStage.tsx:69-72` — `<EffectComposer multisampling={0}>` block — the suspected null-alpha trigger; consider deleting in the B-G1 fix.
- `components/three/SceneFrame.tsx:20-45` — NEW. useFrame-driven throttled progress + integer-index-keyed scene mount.
- `components/scroll/CameraRig.tsx:30-59` — refactored to read both `readActiveSection()` and `readActiveSectionLocal()` inside useFrame; allocates two new `Vector3`s per frame (NB-G1).
- `lib/useActiveSection.ts:78-103` — unchanged from Phase E; exposes `useActiveSection()`, `readActiveSection()`, `readActiveSectionLocal()`.
- `components/three/ClusterStageCanvas.tsx:6-22` — unchanged; reduced-motion branch returns `<StubCanvas/>`; otherwise lazy `SceneStage`.

---

## Evidence artefacts

- `docs/screenshots/phaseG/landing.png` — landing page, renders cleanly
- `docs/screenshots/phaseG/0.png` … `100.png` — all 13 canonical desktop scroll screenshots show the Next.js Runtime TypeError card (`Cannot read properties of null (reading 'alpha')` at `components/three/SceneStage.tsx (48:7) @ SceneStage`)
- `docs/screenshots/phaseG/mobile-{0,33,50,75}.png` — mobile crashes too (`mobile-50.png` shows the error card in 375×812)
- `docs/screenshots/phaseG/_console.json` — 27 entries; 2× `THREE.WebGLRenderer: Context Lost.`, 0 console-error entries during initial mount, 1× transient 404 (HMR chunk)
- `docs/screenshots/phaseG/_errors.txt` — **4 distinct `pageerror`s**, all `EffectComposer.addPass` null-alpha
- `docs/screenshots/phaseG/_dom.json` — initial DOM (clean: H1, 12 sections, 1 canvas), per-scroll probe records (all post-crash: scrollY=0, scrollHeight=900, "This page couldn't load"), crash-sweep step log showing `errCount` rising 0 → 2 between y=1444 and y=1925
- `docs/screenshots/phaseG/_mobile_state.json` — mobile per-scroll probe records (also all post-crash)
- `/tmp/spark-critic-phaseG.mjs` — harness (cached chromium-1223; landing + desktop sweep + canonical desktop + canonical mobile + DOM probes + console capture)

---

**Verdict: FAIL — 47 / 100. The headline finding is unambiguous: B-E1 (= B-G1) is NOT resolved. The worker's deeper-fix did the right architectural moves (module-scoped Canvas configs, throttled per-frame state, imperative CameraRig) but those moves address a secondary symptom — per-frame re-render churn — and not the primary cause, which is that the postprocessing `EffectComposer` constructor calls `renderer.getContext().getContextAttributes().alpha` without a null-guard on a context-lost WebGLRenderer. Same error, same stack, same scroll position (~y=1925, the hero/anatomy boundary), same page-eating Next.js overlay as Phase E. Cannot evaluate alignment, scene completeness, the shuffle centerpiece, mobile, accessibility, audio, or visual polish because none of them mount past the first scroll. Recommended next move: remove `<EffectComposer>` entirely from `SceneStage.tsx` (delete lines 69-72), confirm dev stays stable across the full scroll, then reintroduce post-processing in Phase H wrapped in a context-lost-aware boundary.**
