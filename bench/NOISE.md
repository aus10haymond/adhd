# bench/NOISE.md — judge-noise measurement (Phase 0, task 0.2)

Goal: quantify how noisy the current LLM-as-judge is by running the existing
eval suite 3 times with **no code changes**, then recording per-problem verdict
variance and flagging any problem whose winner flips across runs.

This is a pre-Phase-0 measurement: the eval here is the unmodified `main` eval
(`bench/run-evals.ts`, absolute 1–10 per-dimension scoring, A/B order
randomized per problem). The bias issues catalogued in `AUDIT.md` are *not*
fixed yet — this only measures run-to-run stability of the current scoreboard.

## Runs

Three independent full runs (6 problems each), saved immutably:

- `bench/runs/2026-05-26-noise1/`
- `bench/runs/2026-05-26-noise2/`
- `bench/runs/2026-05-26-noise3/`

Each directory holds `results.json` (full transcripts + verdicts), `EVALS.md`
(rendered report), and `run.log` (console output).

## Per-problem winner across the 3 runs

`(sw)` marks runs where A/B order was swapped (A=baseline, B=adhd). The winner
is reported after un-swapping, so it reflects the real model, not the slot.

| Problem | noise1 | noise2 | noise3 | Flip? |
| --- | --- | --- | --- | --- |
| lru-100ms | ADHD | ADHD | ADHD (sw) | no |
| llm-hang-cli | ADHD | ADHD | ADHD | no |
| rate-limit-leader | ADHD (sw) | ADHD (sw) | ADHD | no |
| fuzzy-bug | ADHD | ADHD | ADHD | no |
| monolith-split | ADHD | ADHD (sw) | ADHD | no |
| naming-feature-flag | ADHD | ADHD | ADHD (sw) | no |

**Winner flip rate: 0 / 6 (0%).** ADHD wins every problem in every run,
including the cases where positional order was swapped. No verdict flips.

## Score variance (per-dimension, ADHD scores, max−min across the 3 runs)

| Problem | breadth | novelty | trap | action | builder |
| --- | ---: | ---: | ---: | ---: | ---: |
| lru-100ms | 0 | 0 | 0 | 0 | 1 |
| llm-hang-cli | 0 | 1 | 1 | 1 | 1 |
| rate-limit-leader | 0 | 0 | 1 | 0 | 2 |
| fuzzy-bug | 0 | 0 | 0 | 1 | 1 |
| monolith-split | 0 | 1 | 0 | 0 | 1 |
| naming-feature-flag | 0 | 1 | 0 | 0 | 0 |

No dimension moves more than 2 points across runs on any problem; most move 0–1.

## Aggregate stability (mean across all problems × dimensions, 0–10)

| Run | ADHD mean | Baseline mean | Δ |
| --- | ---: | ---: | ---: |
| noise1 | 8.00 | 4.47 | +3.53 |
| noise2 | 8.13 | 4.70 | +3.43 |
| noise3 | 7.93 | 4.60 | +3.33 |

The ADHD–baseline gap is stable at +3.3 to +3.5 across all three runs.

## Verdict

Judge self-consistency on the **winner** is high: 0% flip rate, well under the
20% threshold in PLAN.md checkpoint 0 that would force a switch to best-of-3
majority voting. **Best-of-3 voting is not required to proceed.**

Important caveat: low *variance* is not the same as low *bias*. These three
runs agree with each other, but they may be consistently wrong in the same
direction — the length / format-asymmetry / score-chip-leak biases named in
`AUDIT.md` (tasks 0.3, 0.4) would shift every run identically and would not
show up as noise here. Stability tells us the scoreboard is reproducible, not
that it is calibrated. Calibration is what tasks 0.4–0.6 address.
