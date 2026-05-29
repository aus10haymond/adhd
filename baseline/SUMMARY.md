# Baseline v0 — Phase 0 reference

IMMUTABLE. Do not edit. This is the frozen reference the rest of the plan
is measured against (PLAN.md task 0.10). Regenerating it would invalidate
every later comparison.

- Generated: 2026-05-29T21:36:05.521Z
- Commit: `ff75fce59917c4610136417b2e229f4489ceaa78` (branch `main`, working tree had uncommitted changes)
- Model: `claude-haiku-4-5-20251001` (pinned in code — EVAL_MODEL)
- Auth: claude-code subscription — USD figures are SDK estimates at API list price, not a literal bill under subscription
- Problems: 17

## Headline

ADHD 9W / 7L / 1T vs single-shot baseline (pairwise overall) — win rate 53%.

## Key metrics

| Metric | ADHD | Baseline | ADHD/base |
| --- | ---: | ---: | ---: |
| mean output length (est tokens) | 4306 | 1054 | 4.1× |
| total cost (USD est) | $8.1215 | $1.1342 | 7.2× |
| mean latency (s) | 53.2 | 15.7 | 3.4× |

- ADHD idea duplication (lexical): 2% mean across runs

## Per-dimension pairwise wins (ADHD W / base W / tie)

| Dimension | ADHD | base | tie |
| --- | ---: | ---: | ---: |
| breadth | 17 | 0 | 0 |
| novelty | 16 | 1 | 0 |
| trap_detection | 17 | 0 | 0 |
| actionability | 8 | 9 | 0 |
| builder_usefulness | 3 | 14 | 0 |

Full numbers in `metrics.json`; full transcripts in `transcripts.json`. Human-readable per-problem verdicts are in the run's `EVALS.md`.