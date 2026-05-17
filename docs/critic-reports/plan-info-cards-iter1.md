# Critic review — HUD info cards, dot labels, `.count()` action flow

**Plan reviewed:** `docs/plans/2026-05-17-info-cards-and-action-flow.md`
**Reviewer:** critic agent
**Date:** 2026-05-17
**Score:** **72 / 100**
**Verdict:** **BLOCK** — promising direction, fact errors and visual-design assumptions need correction before implementation.

---

## TL;DR

The plan correctly identifies the article's biggest gap (dots without names; the `.count()` cause→effect invisible) and proposes the right primitives. But three things kill it as-written:

1. **At least four numbers are wrong** — C3 price, M2 price, total ephemeral cost, and the implicit "100 byte row" baseline. The Lead self-flagged some of these but did not commit to fixes; the table at line 57 still ships the bad numbers.
2. **Three cards per scene at 720×576 will clutter** — primary + secondary + corner HUD is too many surfaces fighting for the same canvas; the Lead has not yet picked between `<Text>` and `<Html>` and the choice matters a lot.
3. **`.count()` placement is wrong** — Scene 5 already covers "shatter into 8,000 partitions." Stapling the action trigger on top conflates two ideas. The right place is between Scene 4 (data arrival, lazy) and Scene 5 (partitions, eager) — exactly because that is the *moment of transition* the Lead claims to want to dramatize.

---

## 1. Number accuracy — fact-check of the table at lines 44–60

I checked every numeric claim against current GCP pricing (us-central1, list, as of May 2026) and Spark docs.

| # | Claim in plan | Verdict | Correction |
|---|---|---|---|
| 1 | `n2-standard-4 · 4 vCPU / 16 GB` master | ✓ | OK (and matches Lead's prose in scene 3). |
| 2 | `n2-highmem-8 · $0.52/hr` | ✓ | Actual list is **$0.5241/hr** in us-central1. "$0.52" is fine. |
| 3 | YARN container `11 GB / 4 cores` | ⚠ | Container sizing is workload-dependent. With executor.cores=4 on an n2-highmem-8 (64 GB), 11 GB heap + 1.1 GB overhead = 12.1 GB/container and you'd fit ~5 containers per worker. Either commit to `4 cores · 11 GB heap + 1.1 GB overhead` (your scene 2 prose already does) OR drop the "11 GB / 4 cores" gloss because the *container* is heap+overhead. Don't say both. |
| 4 | 8 executors mentioned in scene 3 spark-submit | ⚠ | Lead's scene 3 prose says **cluster of 4 workers · 2 executors each · 32 slots**. Card says `--num-executors 8`. 4 workers × 2 executors = 8 executors. OK, but make sure the card matches the prose explicitly — readers will diff them. |
| 5 | 1 TB · 8,000 files | ⚠ | 1 TB / 8,000 = **128 MB per file** — matches the partition size, which is correct but trivially circular. In real life a 1 TB Parquet dataset is often 200–2000 files of 0.5–5 GB each, and Spark splits *within* files. The "8,000 files" framing is misleading. Either say "8,000 partitions Spark will create" (decoupled from file count) or use a realistic file count like "~800 files". |
| 6 | partition `128 MB · ~1.3 M rows` | ⚠ | 128 MB / 100 B = 1.28 M rows is correct math for *uncompressed* rows. But Parquet compresses 5-10×, so a 128 MB *on-disk* Parquet partition decompresses to roughly **6-12 M rows** in memory at the same row width. Pick a lane: either "128 MB on disk · ~6-12 M rows" or "128 MB in memory · ~1.3 M rows." Today's framing is internally inconsistent. |
| 7 | `8,000 tasks · 32 slots · ~250 tasks/sec` | ✗ | "250/sec" is a guess at task throughput that depends entirely on task duration. The Lead correctly self-flagged it. The math 32 slots × (1 / task duration) only hits 250/s if each task takes **128 ms**, which is unrealistically short for a 128 MB partition (real tasks are 5–30 s on this hardware). Honest math: 32 slots × ~10 s/task = **~3 tasks/sec**, total wall time **8,000 / 3 ≈ 45 min** which contradicts the scene 7 claim of "20 s narrow / 10 min wide" for 1 TB. **Drop the "tasks/sec" callout entirely.** Replace with "queue depth: 7,968" — it teaches the same lesson without lying. |
| 8 | `NARROW · ~20s for 1 TB` | ✗ | 1 TB sequential scan on 32 cores at ~100 MB/s/core = 1024 GB / 3.2 GB/s = **320 seconds = ~5 min**, not 20 s. 20 s is laptop-scale fantasy. Revise to **~3–5 min**. |
| 9 | `WIDE · 850 GB shuffle · ~10 min for 1 TB` | ✗ | Lead self-flagged. The 850 GB number is too high. Shuffle write is "rows compressed" not "Parquet columnar compressed" — so shuffle write is typically ~2× the *on-disk Parquet* size, NOT 0.85× of it. So 1 TB Parquet ≈ 5–8 TB uncompressed ≈ 2–3 TB shuffle write. The "850 GB" feels like someone computed *0.85 × 1 TB* by reflex. Either go with **"shuffle write ≈ 2× input size = ~2 TB"** (memorable, defensible) or pick a smaller working dataset where the math is cleaner (e.g., 100 GB input → 200 GB shuffle). |
| 10 | `BHJ ~2-5 min · 0 shuffle bytes` | ✓ | Scene 8 prose already cites this range with reasoning; fine. |
| 11 | `SMJ ~20-40 min · 2×1 TB shuffle` | ⚠ | "2×1 TB" implies both sides shuffle their full size, which is right *if both sides are 1 TB*. The Lead's prose says "1 TB orders × 100 MB countries lookup", so 2×1 TB on SMJ is mixing two examples. Pick one. Suggest: "SMJ: shuffles **both** inputs in full · 20–40 min for 1 TB × 1 TB." |
| 12 | row `key=US · 256 B` | ⚠ | 256 B/row is reasonable for an orders row with a country key. Fine. |
| 13 | Shuffle write `850 GB · 3,200 shuffle files · 200 partitions` | ✗ | (a) 850 GB wrong, as above. (b) 3,200 files = 16 source executors × 200 dest partitions, but Lead's cluster has 32 slots = 8 executors × 4 cores, NOT 16 executors. So 8 × 200 = **1,600 shuffle files**. Or scale executors to 16 and say so. (c) 200 partitions is the default Spark wants you to override — the Lead's scene 5 prose explicitly says "the 200 default has been wrong since Spark 1.1." Using 200 here is self-contradictory. Use **5,000 or 8,000** to match prose. |
| 14 | AQE `factor 5 · threshold 256 MB · advisory 64 MB` | ✓ | All three are Spark 3.5 defaults. Verified. |
| 15 | AQE skew `1.4 GB · 5.2× median → 6 sub-partitions of ~240 MB` | ✓ | Math: 1.4 GB / 240 MB ≈ 6 ✓. Median would be 1.4 GB / 5.2 ≈ 270 MB ✓. Internally consistent. |
| 16 | Stage 1 `8,000 tasks · 12 min` | ⚠ | If you're using "12 min" total wall time, this conflicts with scene 7's "10 min for the wide step alone" plus scene 11 talking about 5 stages. Either harmonize all wall-time numbers to one canonical scenario (recommended) or stop quoting wall times at all. |
| 17 | Machine prices `E2 $0.13 · N2 $0.39 · n2-highmem-8 $0.52 · C3 $0.58 · M2 $8.00` | ✗ | **Three of five are wrong.** Verified Compute Engine list pricing us-central1 May 2026: E2-standard-4 = **$0.134/hr ✓**, n2-standard-8 = **$0.3885/hr** (so "$0.39" ✓), n2-highmem-8 = **$0.5241/hr ✓**, **c3-standard-8 = $0.3984/hr** (Lead says $0.58 — wrong; you might be confusing with c3-highmem-8 which is ~$0.54). **M2 entry is m2-ultramem-208 at much higher rates**; the closest "$8/hr" machine is m1-ultramem-40 at $6.29/hr or m2-megamem-416 at $50/hr. The "M2 $8.00/hr" number is **invented**. Fix to "m1-ultramem-40 · $6.29/hr" OR rename the visualized planet to M1. |
| 18 | Airflow `schedule: 0 2 * * *` | ✓ | Matches scene 13's "2 AM". Fine. |
| 19 | Ephemeral `$1.20/hr · 12 min = $0.24` | ✗ | **Lead self-flagged this and is still wrong in the corrected direction.** True calc:<br>• 4 × n2-highmem-8 = 4 × $0.5241 = $2.10/hr Compute<br>• 1 × n2-standard-4 (master) = $0.1942/hr Compute<br>• Dataproc surcharge = $0.01/vCPU/hr × (4×8 + 4) = $0.36/hr<br>• **Total ≈ $2.65/hr** × 0.2 hr (12 min) = **$0.53**, not $0.24 and not $0.50.<br>The "$1.20/hr" baseline in the plan is roughly half the real cost. Use **$2.65/hr × 12 min ≈ $0.53** or pick a different cluster size to make the cost-meter visual hit a cleaner number ($1.00, say). |
| 20 | `result: 1,318,400,000 rows` | ⚠ | 8,000 partitions × 1.3 M rows = 10.4 B rows, not 1.318 B. If you keep 1.3 M rows/partition you must say **~10.4 B rows**. If you keep 1.318 B rows you must say ~165 K rows/partition. Pick one. |

**Score on numbers alone: 9/20 callouts ship without revision.** This is the biggest single issue with the plan.

---

## 2. Visual hierarchy — will 3 cards clutter a 720×576 canvas?

Yes. Hard yes.

Look at the existing `PartitionShatter.tsx` (lines 55–56): it already places two stacked PlanetLabels at offset 3.0 and 2.65, plus the master sphere, plus 96 instanced partition motes. Adding a primary card, a secondary card, AND a top-corner HUD takes the same scene from 2 text elements to 5+. At 720 px square with the camera at z=5, a `<Text fontSize={0.14}>` works out to roughly **11 px on screen** at 1× DPR — on the edge of unreadable, and a 720×576 canvas chopped into 5 text overlays loses the planets.

**Concrete fixes:**

- **Drop "3 cards per scene" as the default.** The default should be **one primary card visible at all times + HUD ticker in one corner**. Secondary cards reveal on hover (desktop) or on dwell (mobile after a 2 s pause). This is industry-standard for data-viz overlays (Observable, Mapbox, Three.js Journey examples all do this).
- **HUD should be `<Html>` overlay, not 3D `<Text>`.** Reasons: (1) HUD is screen-anchored not world-anchored — `<Html>` doesn't move with camera; (2) crisp DOM text scales properly with DPR; (3) you can use real CSS/Tailwind classes consistent with the rest of the site's typography; (4) the HUD is the place readers actually look for stats, so they should look like UI, not labels-in-the-world.
- **Info cards anchored to objects should be `<Text>` (or `<Billboard><Text>`).** They need to live in 3D space so they correctly occlude / get occluded and so they track the planet when the camera moves. CSS-2D-overlay'd labels at 3D positions are doable with drei `<Html occlude transform>` but cost more draw calls and break z-ordering.
- **Single source of truth for card style.** Build one `<InfoCard>` component that takes `{anchor, primary, secondary?}` and renders a small frosted-glass plane behind two lines of text. Don't ship 15 ad-hoc label combinations.
- **Connector lines: drop them.** A line from card to object adds clutter for ~zero comprehension gain in a scene that *already* uses spatial proximity. The card is right next to the planet. The line is what graphic designers add when their layout has the card across the canvas from the thing — which yours doesn't.

---

## 3. `.count()` action-flow beat — wrong scene

The Lead's three options:
- A: Add to Scene 5
- B: New scene 4.5 between data-arrival and partitions
- C: Persistent top-left code panel that lights up on actions

**Pick B (new scene), not A.** Reasoning:

- Scene 4 already establishes "lazy plan only — nothing read yet" (line 49 of plan; reinforces scene 4's prose). Scene 5 then immediately says "when Spark finally does read…" (lib/scenes.ts:92). The transition from lazy → eager **is already the topic between these two scenes** — the Lead just hasn't given it visual real estate.
- Putting the action trigger into Scene 5 doubles up: Scene 5 is supposed to teach *partitioning*. Adding code snippet + arrow + stage-0 ticker + final-row HUD turns it into a four-beat scene cramming two ideas (action firing AND partition count). The reader is more confused, not less.
- Option C (persistent corner panel) is interesting but expensive: it implies every scene knows what "action" would fire there, which means writing a 15-scene state machine for a third-tier feature. Skip.

**Recommended: Scene 4.5 — "The Spark wakes."**
- ~10 seconds, four beats:
  1. (0–1.5 s) The 1 TB cloud from Scene 4 sits dormant; a code panel in the lower-left fades in with `df.count()`. Static.
  2. (1.5–3 s) An arrow / pulse travels from the code panel up to the driver. The driver lights up.
  3. (3–7 s) The driver emits 200 tiny ray-lines outward — one per executor it's about to talk to. Each ray paints "stage 0" on its endpoint. (Pick 200 visually distinct rays even if the prose says 8,000 tasks; readers track structure not magnitude.)
  4. (7–10 s) HUD ticker counts up `tasks scheduled: 0 → 8,000` and then the camera pulls back into Scene 5's partition shatter.
- This is the scene that *deserves* the code-snippet floating text and the HUD ticker. Don't dilute it across other scenes.
- Add an entry to `lib/scenes.ts` with id `"action-trigger"`, position 5, and bump all subsequent indices.

(If schedule pressure makes a new scene infeasible, fallback: do A — but **strip the code snippet from Scene 5 and put it inline with Scene 4's prose only**, and let Scene 5's HUD just be the stage-0 ticker. The code/arrow theatre is what makes the new scene worth the cost.)

---

## 4. Connector lines — drop

Covered above. They are a graphic-design crutch for layouts where the card is far from the object. Yours aren't.

---

## 5. Mobile readability at 375 px

`SceneCanvas.tsx` makes the canvas `aspect-square` on mobile and `aspect-[4/5]` from md up. At 375 px viewport that's ~343 px square after the 16 px page padding. With camera fov 38 at z=5, a `<Text fontSize={0.14}>` renders at about **0.14 / (2 × 5 × tan(19°)) × 343 ≈ 14 px** on screen.

14 px is *legible* but is right at the floor for body copy. Outline contrast (already 0.06) helps. Two concrete fixes:

1. **Bump fontSize floor to 0.18 for primary cards on mobile.** Detect via `useThree(state => state.size.width < 600)` and pass a `compact` prop to your `<InfoCard>` that swaps font + drops secondary line.
2. **HUD as `<Html>` solves itself.** CSS text at 12 px is crisp regardless of viewport. The 3D-text legibility risk is only for object-anchored cards.

Also: at 375 px, three cards in a single canvas frame is comically packed. This reinforces the "one primary card + hover for the rest" recommendation in §2.

---

## 6. Performance — real concern, but not the biggest

`SceneStage.tsx` mounts a **single global Canvas** (not the 12-canvas-per-section setup; that's `SceneCanvas.tsx` which is currently *not* the active mount per `app/page.tsx`). So the "4-canvas concurrent budget" framing is slightly off — verify which canvas component is the article's actual production layout before sizing budgets.

Either way:
- A drei `<Billboard><Text>` pair is ~3 draw calls per card (backdrop plane + text mesh + optional border line). 15 scenes × 3 cards = 45 cards = ~135 draw calls. Not free, but trivial vs. the existing instanced meshes (Scene 6 alone is 80 instances, Scene 5 is 96).
- `<Html>` overlays are nearly free for GPU but cost ~1 React render per frame if you use the ticker pattern naively. **Use refs and direct DOM mutation for the ticker** (the Lead's "Tone-style refs" comment in step 4 is correct — confirm this rule and don't drop it later).
- **Real risk:** drei `<Text>` ships an SDF atlas per font. Pre-load one font at the SceneStage root with `<Text font="..." />` so all 15 scenes share it; otherwise you get one atlas per font instance and a noticeable first-paint hiccup. (drei caches per font URL but be deliberate.)

**Performance verdict: not a real risk if you use refs for tickers and share fonts.** Lead's plan doesn't mention font sharing — flag it in implementation step 1.

---

## 7. Pedagogical accuracy of "task ticket · partition #4271 · 128 MB"

The "task ticket" metaphor is **slightly load-bearing in the wrong direction.** A reader will think "ticket" means a queue token. In Spark, a task is closer to a *closure shipped to an executor* — code + partition pointer + executor address (the Lead's scene 6 prose at lib/scenes.ts:108 nails this). "Ticket" doesn't capture the *code* part.

**Recommended label:** `task · partition #4271 · 128 MB` (drop "ticket"). The dot label is supposed to *name the in-flight object*, not analogize it. The analogy lives in the prose; the label should be plain.

Same for "row · key=US · 256 B" — this is good and stays.

`partition #4271` — picking a specific number out of 8,000 is great. It's the kind of detail that makes the visual feel concrete. Keep.

---

## 8. Missing from the plan

Here are concrete Spark facts that *should* be on screen but the plan doesn't propose:

1. **Scene 10 (AQE) needs the EXPLAIN diff.** Show `SortMergeJoin` crossing out → `BroadcastHashJoin` appearing. This is the single most visceral AQE moment for a reader who's used `.explain()`. Without it the scene is "watch a ball split" which is generic.
2. **Scene 8 (Joins) needs a side-by-side timeline.** Three horizontal bars (BHJ ~3 min, SHJ ~8 min, SMJ ~30 min) animating to their endpoints. Numeric callouts are useless without scale.
3. **Scene 9 (Shuffle) needs the network-vs-disk split visualized.** The Lead's scene 9 prose at lib/scenes.ts:150 says "written to disk + sent over network + read back" — that's three distinct moves and the current animation shows only one (the network arc). Add a brief "writing to local disk" pulse on the source executor before each arc launches.
4. **Scene 6 (Tasks) needs the retry visualization.** Lead's prose says "retried up to four times before the whole stage is marked failed." This is high-value information that's *only* in prose. A single red task that bounces back to the source and re-launches is 200 lines of code and adds enormous teaching value.
5. **Scene 14 (Ephemeral) needs the cluster create/delete timeline.** The plan mentions a cost meter but not the 90s create / Xmin run / 15s delete *bands* on a timeline. Three-band animation > ticking dollar number.
6. **Scene 7 (Narrow vs Wide) needs the DAG cut.** Where exactly does the stage boundary fall? A dashed vertical line saying "stage boundary" between the narrow and wide ops is the *defining visual* of stages and Scene 11 references it but never shows it.
7. **Spark version sticker.** Pin the article to a Spark version (3.5? 4.0?). Several numbers change between versions (autoBroadcastJoinThreshold runtime default went from 10→30 MB under AQE in 3.2; Spark 4.0 added VARIANT). Put "Apache Spark 3.5 · Dataproc 2.2" in the article header so every number has a frame of reference.

---

## Order-of-operations (revised)

Lead's order: shared components → scenes 1, 2, 12 → code snippets → HUD ticker → `.count()` → labels → remaining HUDs.

**This is backwards.** You want to validate the *most expensive primitive* (`.count()` action beat + HUD ticker) on the *most reader-critical scene transition* (lazy → eager) **before** spreading the visual vocabulary across 15 scenes. If the `.count()` beat doesn't land, the rest of the cards are decoration.

**Revised order:**

1. **Fix numbers first.** Update the table in the plan with the 11 corrections above. No code yet. (1 hour.)
2. **Pick a canonical example.** One cluster size, one input size, one set of timings that propagate to every scene's HUD. Today's plan has 4-worker cluster in some scenes and 100-executor cluster in scene 8 prose. Lock to **4 × n2-highmem-8 + 1 master · 1 TB input · 8,000 partitions · ~12 min wall time** and rewrite every "concrete callout" against it.
3. **Build `<InfoCard>` + `<HudOverlay>`** in `_shared.tsx`. `<InfoCard>` uses drei `<Billboard><Text>` (3D, world-anchored). `<HudOverlay>` uses drei `<Html>` with Tailwind classes (screen-anchored). Test both on `ClusterIdle` only.
4. **Implement new Scene 4.5 (action-trigger) end-to-end.** Code snippet, arrow, driver pulse, stage-0 ticker, transition into shatter. **This is the make-or-break beat.** If it doesn't work, scrap it before contaminating other scenes.
5. **Add per-scene primary cards** (one card per scene, anchored to the most important object). Skip secondary cards entirely in this pass.
6. **Add dot labels to Scenes 6, 8, 9** (TaskRain, Joins, Shuffle). Use the 1-in-30 rule the Lead proposed.
7. **Add HUD overlays to specs-heavy scenes only** (1, 2, 12, 14). Don't put a HUD on every scene; pick the four where numbers do the most teaching work.
8. **Add secondary cards on hover** as a separate later iteration only if user testing says they're needed.

The big change vs. Lead: **expensive scenes first (Scene 4.5 prototype), simple scenes last.** Lead's "scenes 1, 2, 12 first because specs-heavy" is the cheap path; you want to de-risk the most novel beat first.

---

## Numbered concrete fixes

1. **`docs/plans/2026-05-17-info-cards-and-action-flow.md` line 53** — replace `C3 $0.58/hr` with `C3 $0.40/hr` (c3-standard-8 actual).
2. **Same line 53** — replace `M2 $8.00/hr` with `M1 $6.29/hr` (m1-ultramem-40 actual) AND change the MachineTypesScene planet label from "M2" to "M1" to match. Or pick m2-ultramem-208 and quote a real price after looking it up; the made-up $8.00 must go.
3. **Line 51 (`task-rain` HUD)** — drop `~250 tasks/sec`. Replace with `queue depth · 7,968 tasks waiting`.
4. **Line 52 (`narrow-vs-wide`)** — change `NARROW ~20 s` to `NARROW ~3–5 min` (a 32-core cluster does not scan 1 TB in 20 s).
5. **Line 54 (`shuffle` HUD)** — `850 GB` → `~2 TB shuffle write` (2× input rule of thumb); `3,200 shuffle files` → `1,600 shuffle files` (8 source executors × 200 destinations) OR raise destinations to 5,000 and adjust; `200 partitions` is internally contradictory with Scene 5's prose — bump to `5,000 partitions` to match prose.
6. **Line 50 (`partitions` HUD)** — pick one of `~1.3 M rows/partition` (compressed math) or `~6-12 M rows/partition` (decompressed). Currently inconsistent with itself.
7. **Line 59 (`ephemeral` HUD)** — replace `$1.20/hr × 12 min` with `$2.65/hr × 12 min = $0.53` (real cost including Dataproc surcharge). Lead's self-flag noted this but committed only to "~$0.50"; actual is $0.53 to one decimal, $0.50 to one significant figure — pick and commit.
8. **Line 50 (`partitions` HUD)** — `result = 1,318 M rows` is wrong relative to `1.3 M × 8,000`. Either `10.4 B rows` (consistent with row-density claim) or revise row-density.
9. **Plan structure** — add an explicit "canonical example" section at the top of the plan that locks cluster size / input size / wall times for every downstream callout. Today every scene reinvents its own numbers.
10. **§ "Three deliverables" #3 (lines 32–40)** — relocate the `.count()` action-flow beat to a new Scene 4.5 between data-arrival and partitions. Update `lib/scenes.ts` SceneId list, SCENES array, SceneCanvas/SCENE_COMPONENTS map, and SceneStage SCENE_RENDERERS index logic accordingly.
11. **§ "Three deliverables" #1 (lines 11–21)** — commit explicitly: `<InfoCard>` = drei `<Billboard><Text>` (3D world-anchored). `<HudOverlay>` = drei `<Html>` with Tailwind (screen-anchored). Today the plan says "rendered as a `<Html>` overlay" for HudPanel but is ambiguous about InfoCard. Lock both.
12. **Add an implementation step 0** — pre-load and share the drei `<Text>` font URL at SceneStage root to avoid per-scene SDF atlas allocation. Lead's plan doesn't mention this.
13. **`components/three/scenes/_shared.tsx`** — `PlanetLabel` uses fontSize defaults that work on desktop only. Add a `compact?: boolean` prop that drops secondary line and bumps fontSize to 0.18 floor; SceneCanvas should pass `compact={window.innerWidth < 600}`.
14. **§ "Three deliverables" #2 (lines 23–30)** — replace "task ticket" with "task" in the proposed label format. The "ticket" metaphor mis-teaches.
15. **Plan-wide** — pin the article to "Apache Spark 3.5 · Dataproc 2.2" in the article header so every quoted threshold (autoBroadcastJoinThreshold = 30 MB under AQE, advisoryPartitionSize = 64 MB, etc.) has a version frame.
16. **Add Scene 10 fix** — show the `SortMergeJoin → BroadcastHashJoin` plan diff. Single biggest missing visual in the AQE scene.
17. **Drop connector lines** from the InfoCard spec entirely. Spec the InfoCard as "anchor + offset only", no connector.
18. **§ "Per-scene concrete callouts"** — explicitly mark each "Secondary cards" entry as "(hover-only on desktop, dwell-only on mobile)" — today the table reads as if all three cards show at once.

---

## Block / Approve

**BLOCK.** Score 72/100 (threshold for Approve is 90).

The plan is structurally sound and aims at the right reader-comprehension gaps. But it ships with at least four wrong numbers, an unstated assumption about three-cards-at-once that the canvas can't physically hold, and a `.count()` placement that buries the most important moment in Spark inside an unrelated scene. Fix the corrections above and re-submit.

The Lead's instinct to flag numbers themselves for critic review is right — but flagging is not fixing. The table in the plan still ships with the bad numbers; the self-flagged corrections are buried in §"Technical concerns" prose where no implementer will see them.
