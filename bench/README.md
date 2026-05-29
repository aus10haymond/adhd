# bench/ — the eval harness

Local-only. No CI runs this. It exists to answer one question honestly: **does the
ADHD loop beat a single-shot baseline, and at what cost?** Every later phase in
`../PLAN.md` is gated on not regressing the frozen baseline these scripts produce.

## What it measures

Each problem in `problems.json` is run two ways with the **same pinned model**
(`claude-haiku-4-5-20251001`):

- **ADHD** — the full loop (`src/`): 5 frames × 6 ideas, top-3 deepened.
- **baseline** — one single-shot call with a "be substantive but not bloated" prompt.

A separate LLM judge does a **pairwise A/B/tie** preference per dimension (breadth,
novelty, trap_detection, actionability, builder_usefulness) — no absolute scores.
A/B order is randomized per problem to balance positional bias, and the judge is
told explicitly that length is not quality (the verbosity-bias guard from PLAN 0.4).

Tracked metrics: pairwise win rate, per-dimension wins, length, cost (USD + tokens),
latency, and ADHD idea-duplication rate.

## Running

```bash
npm run evals                       # full suite (all problems)
npm run evals:quick                 # first 2 problems (smoke test)
npm run evals -- --problem lru-100ms   # a single problem
```

Auth: `ANTHROPIC_API_KEY`, or local Claude Code auth (the Agent SDK picks it up).
Under a subscription, USD figures are SDK list-price *estimates*, not a literal bill.

Outputs (written to repo root / `bench/`):
- `EVALS.md` — human-readable verdicts + aggregate tables (committed).
- `bench/results.json` — full transcripts + per-problem usage (committed).

### Resume (long runs)

A full run is ~30 min and hundreds of LLM calls; a subscription throttle can kill
it near the end. The runner **checkpoints each completed problem** to a gitignored
`bench/runs/.progress.json` (keyed to the model + exact problem set) and retries
transient failures with backoff. If a run dies, just **re-run the same command** —
it skips finished problems and resumes. The checkpoint is deleted on clean
completion. Force a clean start with `--fresh`.

## The baseline (PLAN 0.10)

```bash
npm run bench:baseline              # = npm run evals -- --baseline
```

In addition to `EVALS.md` + `results.json`, this writes the **immutable** Phase-0
reference under `../baseline/`:

- `baseline/metrics.json` — `{ meta, ...aggregate metrics }`; `meta` records the
  model, auth mode, git SHA, and generation time.
- `baseline/transcripts.json` — every row, full transcripts.
- `baseline/SUMMARY.md` — the headline numbers, human-readable.

**Do not edit anything under `baseline/` or regenerate it.** Every later comparison
is measured against this exact run; regenerating would invalidate the whole plan.

## Comparing a run to the baseline (PLAN 0.11)

```bash
npm run bench:compare                                   # diffs bench/results.json
npm run bench:compare -- --run bench/runs/<date>-phaseN/results.json
```

Prints deltas on every tracked metric (win rate, per-dimension, cost, latency,
length, duplication) with ▲/▼ direction and +/- improvement/regression marks. It
only *reports* movement — the pass/fail criteria for each phase live in `PLAN.md`
(e.g. Phase 1: self-consistency ≥ baseline, win rate not regressed, cost ≤ 1.5×).

Saving a phase run for comparison:

```bash
mkdir -p bench/runs/$(date +%F)-phase1
npm run evals
cp EVALS.md bench/results.json bench/runs/$(date +%F)-phase1/
npm run bench:compare -- --run bench/runs/$(date +%F)-phase1/results.json
```

## Files

| File | What it is |
| --- | --- |
| `run-evals.ts` | the runner — generate both arms, judge, write reports, checkpoint/resume |
| `metrics.ts` | shared `RowResult` shape + `computeMetrics` (used by runner and compare) |
| `compare.ts` | `bench:compare` — diff a run against the baseline |
| `judge.ts` | the pairwise LLM judge + dimension definitions |
| `pairwise.ts` | reusable A/B/tie comparison primitive (PLAN 0.5) |
| `baseline.ts` | single-shot baseline arm |
| `length.ts` | output-length instrumentation (PLAN 0.3) |
| `dedup.ts` | lexical idea-duplication metric (PLAN 0.9) |
| `calibration.ts` | LLM-vs-human agreement harness (PLAN 0.6) |
| `problems.json` | the problem set (17, across the README's "use it for" buckets) |
| `AUDIT.md` | the 0.1 audit of bias sources |
| `NOISE.md` | judge self-consistency measurement (PLAN 0.2) |
| `runs/` | saved phase runs + logs (logs gitignored) |
