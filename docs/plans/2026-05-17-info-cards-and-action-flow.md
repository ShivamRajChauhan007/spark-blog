# Plan: HUD callouts + dot labels + `.count()` action flow

**Author:** Lead. **Date:** 2026-05-17. **Status:** awaiting critic review.

## Why

Current scenes show planets and motion but never name the *thing*. A reader sees small spheres flying between planets without learning they are "a 128 MB partition" or "a task assigned to one core." Real specs (n2-highmem-8 · 8 vCPU · 64 GB · $0.52/hr) are mentioned in prose but not in the visuals where they belong. And the most important Spark moment — the user calls an *action* like `.count()` and the lazy DAG springs to life — is invisible in the current animation.

## Three deliverables

### 1. Per-scene HUD info cards

A new shared `<InfoCard>` 3D component:
- Anchored to a world point on an object
- Drei `<Billboard>` so it always faces the camera
- Backdrop = thin rounded plane with semi-transparent black + 1 px line border
- Two-line text inside: top line bold-ish ("MASTER"), bottom line muted detail ("n2-standard-4 · 4 vCPU / 16 GB")
- Optional connector: a thin line from card corner to the labeled object

Also a `<HudPanel>` for screen-corner stats (top-left HUD), rendered as a `<Html>` overlay from drei for crisp text.

### 2. Label every mystery dot

In current animations, small spheres dart around without names. Plan:
- ShuffleScene: pick 2-3 representative arc rows and attach a tiny label "row · key=US"
- TaskRain: label one in-flight task: "task · partition #4271 · 128 MB"
- PartitionShatter: label one mote: "partition · 128 MB · ~1.3 M rows"
- WorkerCutaway: label one "done" mote as "task complete"

Labels appear once per cycle (e.g., 1 in every 30 dots gets a label) so the screen is not noisy.

### 3. `.count()` action-flow beat

Enhance **Scene 5 PartitionShatter** with a 4-second intro:
- t = 0–0.5s : code snippet appears in the canvas — `df.count()`
- t = 0.5–1.0s : arrow "↓ action triggered · catalyst optimises plan"
- t = 1.0–4.0s : existing shatter animation, but with a HUD ticker "stage 0 · 8,000 tasks queued · 32 in flight"
- t = 4.0s+ : HUD shows "result: 1,318,400,000 rows" briefly

This gives readers the *lazy → eager* transition they need to see.

## Per-scene concrete callouts

| Scene | Primary card | Secondary cards | HUD |
|---|---|---|---|
| 1 Hero | MASTER · n2-standard-4 · 4 vCPU / 16 GB | one worker: n2-highmem-8 · 8 vCPU / 64 GB · $0.52/hr | FLEET · 4 × n2-highmem-8 · 32 vCPU · 256 GB |
| 2 Anatomy | YARN container · 11 GB / 4 cores | Executor · 4 cores · 11 GB heap + 1.1 GB overhead; one orbit dot: core thread · 1 task | — |
| 3 Driver | Driver JVM · 4 GB heap · main() + scheduling | code: `spark-submit --deploy-mode cluster --executor-cores 4 --executor-memory 11g --num-executors 8` | — |
| 4 Data arrival | 1 TB · 8,000 files · gs://orders/2026/*.parquet | "lazy plan only — nothing read yet" | — |
| 5 Partitions | partition · 128 MB · ~1.3 M rows | code: `df.count()`; arrow: "↓ action triggered" | 8,000 partitions · 128 MB each ≈ 1 TB · result = 1,318 M rows |
| 6 Tasks | task ticket · partition #4271 · 128 MB | worker label flips to "processing 6 cores" when hit | 8,000 tasks · 32 slots · ~250 tasks/sec |
| 7 Narrow vs Wide | NARROW · filter · no shuffle · ~20s for 1 TB | WIDE · groupBy · 850 GB shuffle · ~10 min for 1 TB | — |
| 8 Joins | per strategy: BHJ ~2-5 min · 0 shuffle bytes | SMJ ~20-40 min · 2×1 TB shuffle; SHJ AQE-only middle ground | hint priority: BROADCAST > MERGE > SHUFFLE_HASH > SHUFFLE_REPLICATE_NL |
| 9 Shuffle | row · key=US · 256 B | "every row written to disk + sent over network + read back" | Shuffle write: 850 GB · 3,200 shuffle files · 200 partitions |
| 10 AQE | skew · 1.4 GB · 5.2× median | "AQE rule: skewedPartitionFactor > 5 ∧ size > 256 MB → split"; result: "→ 6 sub-partitions of ~240 MB" | factor 5 · threshold 256 MB · advisory 64 MB |
| 11 Stages | Stage 1 · 8,000 tasks · 12 min | "← shuffle 850 GB →" between stages | — |
| 12 Machine Types | per planet cost: E2 $0.13/hr · N2 $0.39/hr · ★n2-highmem-8 $0.52/hr · C3 $0.58/hr · M2 $8.00/hr | star explicit on the recommended one | — |
| 13 Airflow | DataprocCreateClusterOperator | DataprocSubmitJobOperator; DataprocDeleteClusterOperator(trigger_rule='all_done') | schedule: 0 2 * * * |
| 14 Ephemeral | cost meter ticking $0.00 → $0.24 | "create 90s · run 11min · delete 15s = $0.24" | $1.20/hr × 12 min |
| 15 Fly | hover any planet → reveals its label | — | MASTER · 8 WORKERS · 200 PARTITIONS · YOU |

## Technical concerns I want the critic to validate

1. **Number accuracy**:
   - 8,000 partitions × 128 MB = 1,024 GB ≈ 1 TB ✓
   - n2-highmem-8 list price is $0.52/hr in us-central1 (research agent's number — should I source-link this?)
   - "850 GB shuffle for 1 TB groupBy" — is this realistic? Shuffles usually compress to 30-60% of input. So a 1 TB input groupBy would shuffle ~300-600 GB. Maybe revise to "~400 GB"
   - "1.3 M rows per 128 MB partition" assumes ~100 byte rows. Acceptable averaging.
   - "250 tasks/sec" — depends on cluster size. For 32 slots on 100ms tasks = 320/s; safer to say "~200/s"
   - $0.24 for 12 min on 4 × n2-highmem-8 + master: 4 × $0.52 × 0.2hr + $0.10 master ≈ $0.52. Revise to ~$0.50.
   - AQE skew sub-partition count: "6 sub-partitions of ~240 MB" — math: 1.4 GB / 240 MB = ~6 ✓
   - M2 ultramem-104 price $8.00/hr — verify

2. **Visual hierarchy**:
   - Do 3 cards per scene feel cluttered?
   - Should the HUD always be in the same corner (top-right) or context-appropriate?
   - Should secondary cards appear only on hover/click, not by default?

3. **`.count()` flow placement**:
   - Insert in Scene 5 (current proposal), OR
   - Add a NEW Scene 4.5 "the action" between data-arrival and partitions, OR
   - Make it a small persistent code panel in the top-left of every scene that lights up when an action would fire

4. **Connector lines**: do they help or just add noise?

5. **Mobile**: cards on a 375 px viewport — what shrinks first?

## Implementation order (after critic approval)

1. Build `<InfoCard>` + `<HudPanel>` in `_shared.tsx`
2. Add to Scene 1 + 2 + 12 first (specs-heavy)
3. Add code-snippet floating support (drei `<Text>` with monospace) and use in Scene 3 + Scene 5
4. Add tick-by-tick HUD update mechanism (uses Tone-style refs to avoid React re-render)
5. Add `.count()` beat to Scene 5
6. Add dot labels to Scenes 6, 9
7. Add per-scene HUDs to remaining

## Success criteria for next critic pass

- Score ≥ 95
- Every concrete number cited in research is also visible in the canvas, not just the prose
- The `.count()` beat reads as a single legible cause→effect
- No card blocks the planet it labels
- Mobile layout still readable
