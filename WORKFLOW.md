# Workflow — Worker / Critic loop

```
┌─────────────────────────────────────────────────────────────┐
│  LEAD (main conversation thread)                            │
│  · Reads PROGRESS.md and active phase                       │
│  · Dispatches Worker (in parallel where safe)               │
│  · Then dispatches Critic                                   │
│  · Commits on PASS, advances task                           │
│  · Schedules its own next wakeup (15-25 min cadence)        │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
   ┌───────────────────────┐         ┌───────────────────────┐
   │ Worker(s)             │         │ Critic                │
   │  - reads phase brief  │  ───▶   │  - npm build / lint   │
   │  - implements         │         │  - boot dev server    │
   │  - npm build + commit │         │  - screenshot via     │
   │  - reports diff       │         │    agent-browser      │
   └───────────────────────┘         │  - score 0..100       │
                                     │  - write report       │
                                     │  - PASS or FAIL list  │
                                     └─────────┬─────────────┘
                                               │
                                               ▼
                          ┌────────────────────────────────┐
                          │ score >= 95 ?                  │
                          │   YES → mark phase done        │
                          │         dispatch next phase    │
                          │   NO  → dispatch Worker again  │
                          │         with FAIL list         │
                          │         iter++                 │
                          │         iter > 3 → KNOWN_ISSUES│
                          │                 skip forward   │
                          └────────────────────────────────┘
```

## Cadence rules

- **Self-wakeup** every 15-25 min (longer for heavy builds) via ScheduleWakeup
- **Hard wall-clock cap** = 5 hours from kickoff. Stop and write final PROGRESS.md.
- **Git commit** at every PASS; squash-rebase ok
- **Branch** = main; no force pushes
- **Dev server port** = 3737 (canonical)
- **Screenshot path** = `docs/screenshots/<phase>/<percent>.png`
- **Critic reports** = `docs/critic-reports/<phase>-<iter>.md`

## Parallelism rules

- Worker tasks for the SAME phase run sequentially (file conflicts)
- Worker tasks across INDEPENDENT phases (e.g. content prose + audio patches) can run in parallel
- Critic always runs alone after a Worker batch
