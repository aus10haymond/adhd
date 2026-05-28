# PLAN.md — ADHD Skill Improvement Plan

A phased plan for improving a fork of the ADHD skill (https://github.com/UditAkhourii/adhd).
This document is the working spec for Claude Code. Work it top to bottom.

## Why this plan exists

The two weakest parts of the current project are the **critic** (it ingests all N
divergence branches in one call, and judgment degrades past roughly 3 branches) and
the **eval** (LLM-judge vs single-shot, vulnerable to verbosity bias and judge noise,
so the win-rate numbers cannot currently be trusted).

The fix order is deliberate: make the eval trustworthy and freeze a baseline FIRST,
then change system code, and gate every later phase on a benchmark comparison.
You cannot improve a system whose own scoreboard you do not trust.

## Non-goals (do not do these)

- Do not add agent-rank hierarchies, "lieutenant/sergeant/corporal" layers, or
  multi-orchestrator stacks. Each coordination hop loses state and degrades judgment.
- Do not add layers to chase elaborate output. The wins here are a better critic,
  a trustworthy eval, lower cost, and smarter frame selection. Nothing else.
- Do not soften or pad outputs to score better. Verbosity gaming is the exact bias
  Phase 0 is built to detect.

---

## How to use this document (instructions for Claude Code)

1. Work phases in order. Do not start a phase until the previous phase's benchmark
   checkpoint has passed.
2. Each task is a checkbox. When a task is finished, edit this file and change
   `- [ ]` to `- [x]` for that task.
3. After completing each task, commit with message format:
   `plan(P<phase>.<task>): <short description>`  (example: `plan(P0.3): add length instrumentation`).
4. Benchmark checkpoints are mandatory gates. If a checkpoint regresses against the
   baseline, STOP. Diagnose and fix before continuing. Never mark a phase complete
   with a failing checkpoint.
5. Baselines are immutable. Never edit anything under `baseline/` once written.
6. Save every benchmark run under `bench/runs/<ISO-date>-<label>/`.
7. At the end of each phase, update that phase's status line and the progress table
   at the bottom of this file, then commit.

---

## Repo orientation

- `bench/` — the eval suite. Contains `problems.json` and `results.json`.
- `src/` — the system code. `src/frames.ts` defines the cognitive frames.
- `EVALS.md` — human-readable eval verdicts (currently auto-committed).
- `SKILL.md` — the drop-in skill body.
- `package.json` — `npm run evals` and `npm run evals:quick` already exist.

## Metrics tracked across all phases

- **Pairwise win rate** vs single-shot baseline (primary quality metric).
- **Length-normalized win rate** (win rate after controlling for output length).
- **Judge self-consistency** (verdict variance when the same comparison is rejudged).
- **Cost per run** (input tokens, output tokens, USD).
- **Wall-clock latency** per run.
- **Idea duplication rate** (percent of near-duplicate ideas within a run).

---

## Phase 0 — Trustworthy benchmarking and baseline

Goal: before touching any system code, make the eval something you can trust, then
freeze a baseline of the current unmodified `main`.

### Tasks

- [x] 0.1 Audit the current eval. Read `bench/`, `EVALS.md`, and `bench/problems.json`.
  Write `bench/AUDIT.md` describing: how problems are scored, the exact judge prompt,
  the number of problems, and every source of bias you can identify.
- [x] 0.2 Measure current judge noise. Run the existing eval suite 3 times with no code
  changes. Record per-problem verdict variance. Flag any problem whose winner flips
  across runs. (See `bench/NOISE.md`: 0% winner-flip rate across 3 runs; best-of-3 voting not required.)
- [x] 0.3 Add length instrumentation. Log the token count of every ADHD output and every
  single-shot baseline output, per problem, into the results file. (See `bench/length.ts`;
  `results.json` now carries `lengths` per row + a length table in `EVALS.md`. Existing
  runs show ADHD ≈ 4.3× longer than baseline — confirms the verbosity-bias concern for 0.4.)
- [x] 0.4 Implement length-controlled judging. At minimum: (a) explicitly instruct the
  judge to ignore length and verbosity, and (b) report win rate stratified by output
  length bucket so verbosity-driven wins are visible. (Done: judge system prompt now has
  a LENGTH-IS-NOT-QUALITY rule; `EVALS.md` adds a win-rate-by-length-bucket table. Also
  folded in the audit's score-chip-leak fix — judge renders with `chips: false`.)
- [x] 0.5 Implement a pairwise tournament judging harness. Replace absolute 1-10 scoring
  with pairwise A/B comparison plus an explicit "tie" option. Keep the existing A/B
  order randomization. (Done: reusable `bench/pairwise.ts` `comparePair` primitive — judge
  now returns per-dimension A/B/tie preference, no 0–10 scores. `EVALS.md` reports
  per-dimension pairwise win counts. A/B randomization retained. Reused by task 1.2.)
- [x] 0.6 Add a human-rated calibration subset. Pick 5 problems. Create
  `bench/human-ratings.template.json` for a person to fill in pairwise preferences.
  Add a script that reports agreement between the LLM judge and the human ratings.
  (Done: 5 problems chosen; template + `bench/calibration.ts` with `calib:prepare`
  (writes blinded A/B docs) and `calib:report` (overall + per-dim agreement). Generated
  artifacts gitignored; the human fills ratings against the 0.10 baseline run.)
- [ ] 0.7 Expand the problem set from ~6 to at least 15 problems in `bench/problems.json`,
  covering the categories listed in the README "use it for" section.
- [ ] 0.8 Add cost and latency capture. Record input tokens, output tokens, USD, and
  wall-clock time per run into the results file.
- [ ] 0.9 Add an idea-duplication metric. Measure the percent of near-duplicate ideas
  within a run (embedding cosine similarity or a judge-based check). Measure it now
  even though dedup is not implemented until Phase 2.
- [ ] 0.10 Build the baseline. Run the full improved eval against the current unmodified
  `main`. Write to an immutable `baseline/` directory: `baseline/metrics.json`,
  `baseline/transcripts.json`, `baseline/SUMMARY.md`. Record the `main` git commit SHA
  in the summary.
- [ ] 0.11 Write `bench/README.md` documenting how to run the eval and how to compare a
  run to the baseline. Add npm scripts `bench:baseline` and `bench:compare`.

### Benchmark checkpoint 0

- [ ] Confirm `baseline/` is populated and committed.
- [ ] Confirm judge self-consistency is recorded. If the verdict flips on more than 20
  percent of problems, the eval is too noisy: switch the judge to best-of-3 majority
  voting before proceeding.
- [ ] Tag the repo: `git tag baseline-v0`.

To mark this phase: when every task above is `[x]` and checkpoint 0 passes, set the
status line below to DONE, update the progress table, and commit.

**Phase 0 status: NOT STARTED**

---

## Phase 1 — Critic redesign

Goal: fix the convergence gate. The critic currently ingests all N branches in one
call, and judgment degrades once it holds more than about 3 reasoning chains at once.

### Tasks

- [ ] 1.1 Replace the single all-branches scoring call with independent per-idea scoring
  so no single call holds all branches.
- [ ] 1.2 Implement pairwise tournament selection for the shortlist (Swiss or single
  elimination). Reuse the harness from task 0.5.
- [ ] 1.3 Add best-of-3 majority voting for trap detection to reduce false positives
  and false negatives.
- [ ] 1.4 Cap the number of branches fed into any single critic call at 3. If there are
  more, do hierarchical reduction: score in groups, then compare group winners.
- [ ] 1.5 Lower the critic temperature and fix seeds where the SDK allows, so scoring is
  closer to deterministic.
- [ ] 1.6 Unit-test the critic. Feed it known-good vs known-bad idea pairs and assert it
  prefers the good one.

### Benchmark checkpoint 1

- [ ] Run the full eval, save to `bench/runs/<date>-phase1/`.
- [ ] Compare to baseline. Pass criteria: judge self-consistency improved or equal,
  pairwise win rate not regressed, cost per run within 1.5x of baseline.
- [ ] If win rate regressed, investigate and fix before continuing. Do not proceed.

To mark this phase: all tasks `[x]`, checkpoint 1 passed, status line updated, table
updated, committed.

**Phase 1 status: NOT STARTED**

---

## Phase 2 — Efficiency

Goal: cut cost and stop the critic from spending budget ranking duplicate ideas.

### Tasks

- [ ] 2.1 Add prompt caching for the shared prefix (problem, context, system prompt)
  across the N divergence calls. Verify cache hits in the API usage response.
- [ ] 2.2 Implement a semantic dedup pass between divergence and scoring. Cluster
  near-duplicate ideas, keep one representative per cluster, and record the merged count.
- [ ] 2.3 Make concurrency adaptive to rate-limit headroom rather than a fixed cap.
- [ ] 2.4 Add a `--budget` cap that stops a run cleanly once a token or USD ceiling is hit.

### Benchmark checkpoint 2

- [ ] Run the full eval, save to `bench/runs/<date>-phase2/`.
- [ ] Compare to baseline and to the Phase 1 run. Pass criteria: cost per run reduced
  vs Phase 1, duplication metric reduced, win rate not regressed.

To mark this phase: all tasks `[x]`, checkpoint 2 passed, status line updated, table
updated, committed.

**Phase 2 status: NOT STARTED**

---

## Phase 3 — Frame intelligence

Goal: stop picking frames blindly. Learn which frames win for which problem shapes.

### Tasks

- [ ] 3.1 Tag each problem with a shape label (design, naming, debugging, strategy, and
  so on) in `bench/problems.json`.
- [ ] 3.2 After each run, record which frames produced ideas that survived to the
  shortlist. Store this in `bench/frame-stats.json`.
- [ ] 3.3 Implement adaptive frame selection: weight frame choice by historical survival
  rate for the matched problem shape, with an exploration floor so every frame still
  gets sampled.
- [ ] 3.4 Add a frame-pack mechanism (security, ML, frontend, distsys) per the project
  roadmap.
- [ ] 3.5 Backfill `frame-stats.json` by replaying the baseline and earlier phase runs
  if the saved transcripts allow it.

### Benchmark checkpoint 3

- [ ] Run the full eval, save to `bench/runs/<date>-phase3/`.
- [ ] Compare to baseline and to the Phase 2 run. Pass criteria: win rate improved vs
  Phase 2, or equal win rate at lower cost.

To mark this phase: all tasks `[x]`, checkpoint 3 passed, status line updated, table
updated, committed.

**Phase 3 status: NOT STARTED**

---

## Phase 4 — Final validation and honest writeup

Goal: confirm the gains are real and update all public claims to match measured reality.

### Tasks

- [ ] 4.1 Run the full eval 3 times to measure run-to-run variance of the final system.
- [ ] 4.2 Produce `bench/FINAL-COMPARISON.md`: baseline vs final on every tracked metric,
  with deltas and confidence intervals.
- [ ] 4.3 Refresh the human-rated calibration subset and re-check LLM-vs-human agreement.
- [ ] 4.4 Update `EVALS.md` and `README.md` so every claim matches what the new eval
  actually supports. Remove or soften any claim the eval does not back.
- [ ] 4.5 Tag the repo: `git tag final-v1`.

To mark this phase: all tasks `[x]`, status line updated, table updated, committed.

**Phase 4 status: NOT STARTED**

---

## Phase 5 — Candidate / not yet scheduled

Surfaced during the Phase 0 audit (`bench/AUDIT.md`). Not a committed phase
— a placeholder so the idea is not lost.

- **Strong-baseline arm.** The current baseline is undermotivated ("be
  substantive but not bloated"). A baseline prompted "give me 6 distinct
  approaches under different framings, then pick one and explain the risk"
  would close most of the breadth gap without parallel calls. Add a strong
  baseline alongside the current one and judge ADHD against the *stronger*
  of the two. This caps the published win rate to what is real, and answers
  the harder question: is the divergent-frame mechanism the lift, or is
  prompt design alone enough?
- **Different-model judge.** Generator and judge are currently both Claude.
  Re-run the eval with a non-Claude judge to break same-model bias and
  check whether the win rates hold.
- **Score-distribution histograms** per dimension to catch ceiling/floor
  effects that pull arithmetic means.

**Phase 5 status: CANDIDATE (not scheduled)**

---

## Progress summary table

Update after each phase checkpoint.

| Phase | Status      | Win rate vs baseline | Cost vs baseline | Notes |
| ----- | ----------- | -------------------- | ---------------- | ----- |
| 0     | NOT STARTED | baseline             | baseline         |       |
| 1     | NOT STARTED |                      |                  |       |
| 2     | NOT STARTED |                      |                  |       |
| 3     | NOT STARTED |                      |                  |       |
| 4     | NOT STARTED |                      |                  |       |

---

## Regression rule

If any benchmark checkpoint regresses against the baseline on the primary win-rate
metric, treat it as a blocker. Either fix the cause or revert the phase. Do not carry
a regression forward into the next phase. A change that scores worse and survives is
worse than no change at all.
