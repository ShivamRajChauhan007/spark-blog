# Continue instructions (for the Lead's future wakeups)

This is the entry point on every wakeup during the 5-hour autonomous run.

## Read in order

1. `PROGRESS.md` — current phase, last-completed phase, blockers
2. `WORKFLOW.md` — the build/critic loop rules
3. `AGENTS.md` — role definitions and phase ledger
4. `KNOWN_ISSUES.md` (if present) — anything stalled
5. `docs/critic-reports/` — most recent critic verdict

## Then act per phase

- **If Worker just finished a phase** → dispatch Critic agent (general-purpose, foreground), which writes a report under `docs/critic-reports/` and returns score
- **If Critic returned PASS (≥95)** → mark task complete, append PROGRESS.md, advance to next phase, dispatch Worker (general-purpose, foreground) with the new phase brief
- **If Critic returned FAIL (<95)** → dispatch Worker with the fail list, iter++
- **If iter ≥ 3 on same blocker** → append to KNOWN_ISSUES.md, move on

## At end of every turn

Call `ScheduleWakeup` with delaySeconds 1500 (25 min) and prompt:
> "spark-blog autopilot wakeup — read CONTINUE.md and act per current phase in PROGRESS.md"

Stop scheduling when:
- All phases marked complete with ≥95 scores, OR
- 5 hours have passed since kickoff (check first commit timestamp), OR
- Critical blocker that needs human input

## Hard rules

- Stay in `/Users/s0k0f41/PersonalWorkSpace/spark-blog/`
- Commit on every PASS
- Never push to remote
- Use the Worker / Critic skill files in `.claude/skills/` as the source of truth for what those agents must do
- Dev server canonical port: 3737
- Builder agents run sequentially within a phase, parallel across phases
