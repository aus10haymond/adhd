# Evals

[← back to README](../README.md)

ADHD ships with a reproducible eval suite that compares it head-to-head against a single-shot baseline across a set of open-ended engineering problems. An LLM-as-judge with a skeptical-staff-engineer system prompt scores both outputs on five dimensions — **breadth**, **novelty**, **trap detection**, **actionability**, **builder usefulness** — and declares a winner. A/B order is randomized per problem to balance positional bias.

## Headline results

Mean scores across 6 problems (0–10). Full per-problem verdicts in [`EVALS.md`](../EVALS.md).

| Dimension          | ADHD     | Baseline | Δ        | Ratio    |
| ------------------ | -------: | -------: | -------: | -------: |
| breadth            | **9.00** | 4.83     | **+4.17** | 1.9× |
| novelty            | **7.83** | 2.67     | **+5.17** | 2.9× |
| trap_detection     | **9.50** | 1.83     | **+7.67** | 5.2× |
| actionability      | **9.50** | 6.50     | **+3.00** | 1.5× |
| builder_usefulness | **7.67** | 6.83     | **+0.83** | 1.1× |

ADHD wins 5 of 6 problems head-to-head. The biggest gap is **trap detection** — single-shot baselines almost never name the seductive-but-broken ideas, while ADHD's separate critic pass routinely flags 15–20 of them with mechanistic reasons.

_Run date: 2026-05-25._

## Running it

```bash
npm run evals          # full suite (~6 problems, ~10 LLM calls each)
npm run evals:quick    # first 2 problems
npm run evals -- --problem lru-100ms   # one specific problem
```

Output: [`EVALS.md`](../EVALS.md) (human-readable verdicts + aggregate table) and `bench/results.json` (full transcripts).

The eval suite is **local only**. There is no CI workflow for it. Reproducible numbers come from `npm run evals` on your machine; commit the resulting `EVALS.md` if you want to update the repo's published figures. The committed `EVALS.md` was generated this way.

Adding a new problem is a 4-line change to [`bench/problems.json`](../bench/problems.json) — see [CONTRIBUTING.md](../CONTRIBUTING.md#adding-an-eval-problem).

## Known limitations

Stated plainly, because reviewers will find them anyway:

- **Same-model judging.** The judge is the same model family as the generator (familiarity bias). Cross-model judging is on the roadmap ([issue #6](https://github.com/UditAkhourii/adhd/issues/6)).
- **Small set.** Six problems, all engineering-shaped.
- **Scale gap.** Evals run at K=5 branches; the academic diversity literature measures at K=100. Bridging this is tracked in [issue #18](https://github.com/UditAkhourii/adhd/issues/18).
- **Human-in-the-loop applicability is unproven.** A controlled CHI 2025 study found no significant benefit from LLM problem-reframing with human designers. ADHD's LLM-to-LLM context differs, but this is honest counter-evidence, tracked in [issue #16](https://github.com/UditAkhourii/adhd/issues/16).

## Roadmap

- [ ] Recursive deepen (multi-level ToT, not just one)
- [ ] Pluggable scorers (user-defined weights, custom trap detectors)
- [ ] Frame packs (security, ML, frontend, distsys, product)
- [ ] Memory across runs — learn which frames win for which problem shapes ([issue #10](https://github.com/UditAkhourii/adhd/issues/10))
- [ ] Streaming output during divergence
- [ ] Cross-LLM support (frames don't depend on Claude)
- [ ] Hyperfocus / flow-state companion skill ([issue #11](https://github.com/UditAkhourii/adhd/issues/11))

See the [full issue tracker](https://github.com/UditAkhourii/adhd/issues) for the live backlog.
