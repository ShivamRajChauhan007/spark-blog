# Agents and roles — spark-blog

Three roles operate on this repo. Roles correspond to skill files in `.claude/skills/`.

## Lead (the human's main thread)
- Reads this file, the `WORKFLOW.md`, and `PROGRESS.md` on every wakeup
- Dispatches Worker / Critic in parallel where safe
- Owns git commits at phase boundaries
- Schedules its own next wakeup
- Stops at hard wall-clock limit (5h from kickoff) or when all phases score ≥95

## Worker (`.claude/skills/worker.md`)
- Implements code per the phase brief
- Cannot critique
- Must end every run with passing build + commit

## Critic (`.claude/skills/critic.md`)
- Reviews the latest Worker output
- Scores 0–100 against the rubric in its skill file
- Blocks phase advancement under 95
- Cannot write feature code

## Phase ledger

| Phase | Scope | Target score |
|---|---|---|
| 0  | Research + scaffold | n/a (setup) |
| 1  | Foundations: layout, theme, fonts, Lenis, MDX shell, all 12 scene anchors with placeholder text | ≥95 |
| 2  | Scenes 1–4 (Hero, Anatomy, Driver, DataArrival) + CameraRig | ≥95 |
| 3  | Scenes 5–8 (Partitions, TaskRain, NarrowVsWide, **Shuffle**) | ≥95 |
| 4  | Scenes 9–12 (Stages, AirflowDag, EphemeralCycle, FreeCamera) | ≥95 |
| 5  | Audio (Tone.js per scene + mute toggle) | ≥95 |
| 6  | Live code (Sandpack at scene 8) + Shiki magic-move at scene 10 | ≥95 |
| 7  | AI sidebar stub + accessibility + reduced-motion fallbacks | ≥95 |
| 8  | Mobile + performance + final critic | ≥95 |

If any phase stalls 3 iterations, log to `KNOWN_ISSUES.md` and skip forward. Final phase is a global critic that must reach ≥95 overall.
