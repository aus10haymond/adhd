# bench/AUDIT.md — current eval audit (pre-Phase-0)

A snapshot of the eval as it exists on `main` before any Phase 0 changes. The
purpose of this document is to name what is currently measured, how it is
measured, and every source of bias I can identify. Phase 0 then fixes the
issues called out below.

Eval entry point: `bench/run-evals.ts`. Runs via `npm run evals` (full) or
`npm run evals:quick` (first 2 problems).

---

## 1. What the eval actually measures

Per problem, the eval generates **two outputs**:

- **ADHD output**: `src/index.ts → run()` with the default config — 5 frames ×
  6 ideas, top-3 deepened, code-mode on — then `renderText()` is called to
  produce the terminal-rendered string the judge sees. ANSI escapes are
  stripped before judging.
- **Baseline output**: a single `callLLM()` with a fixed system prompt
  (`BASELINE_SYSTEM` in `run-evals.ts`):
  > "You are a thoughtful senior engineer. When asked to ideate on a problem,
  > give a useful answer with multiple approaches, tradeoffs, and a
  > recommendation. Be substantive but not bloated."

Both outputs are then handed to `judge()` in `bench/judge.ts`. The judge is a
single LLM call that:

1. Sees both outputs blinded as "OUTPUT A" and "OUTPUT B".
2. Scores each on five 0–10 dimensions:
   - `breadth` — range of structurally distinct angles
   - `novelty` — non-obvious-but-viable ideas
   - `trap_detection` — names ideas that look good but are traps, with reasons
   - `actionability` — sketch + named risk + concrete first step
   - `builder_usefulness` — which is more useful to ship from
3. Declares an `overall_winner`: `"A" | "B" | "tie"`.
4. Returns a one-line summary.

A/B order is randomized **per problem** (`swapped = Math.random() < 0.5`) to
balance positional bias across the run. The `swapped` bit is recorded per row
so downstream aggregation can map A/B back to ADHD/baseline.

The judge system prompt is in `bench/judge.ts` lines 25–39; the rubric is
included in that prompt verbatim.

Aggregates written to `EVALS.md`:
- Headline W/L/T count
- Mean score per dimension across all problems for both systems
- Per-problem verdict table with reasons

Full transcripts (including raw output strings) written to
`bench/results.json`.

---

## 2. Problem set as of this audit

6 problems in `bench/problems.json`, one per category:

| id                    | category         |
| --------------------- | ---------------- |
| `lru-100ms`           | systems          |
| `llm-hang-cli`        | ux/reliability   |
| `rate-limit-leader`   | distsys          |
| `fuzzy-bug`           | debugging        |
| `monolith-split`      | refactor         |
| `naming-feature-flag` | naming           |

Categories from the README "use it for" section that are **not represented**:

- API / SDK / CLI surface design (naming covers naming, not surface design)
- Code-review widening ("what could go wrong here")
- Strategy, positioning, pricing
- Inside-agent decision points

Phase 0 task 0.7 expands the set to ≥15 with these categories covered.

---

## 3. Sources of bias and noise

Listed in rough order of how much they distort the headline number.

### 3.1 Verbosity / length bias (CRITICAL)

The judge is given two raw text blobs. The ADHD output is **structurally
longer** than the baseline: it contains a wide-set listing, clusters,
shortlist, deepened sketches with child ideas, traps with reasons, and a
provocation. The baseline is one prose answer. The judge prompt does not tell
the judge to ignore length, and the rubric dimensions (breadth, novelty,
trap_detection, actionability) all reward "more content present" by
construction.

**Concretely**: any output that lists 30 ideas across 5 angles will score
higher on `breadth` than one that lists 4 approaches, **even if the 4
approaches are objectively better**. `trap_detection` is the worst-affected
dimension — ADHD's separate critic pass is structurally required to emit
traps, the baseline has no equivalent section, so the baseline's
`trap_detection` score is near-floor on most problems by format alone.

The headline `5.2× ratio on trap_detection` reported in `EVALS.md` is the
single result most exposed to this bias.

Fix path: tasks 0.3 (length instrumentation) and 0.4 (length-controlled
judging).

### 3.2 Format-asymmetry bias

Related to but distinct from raw length: the ADHD output is **pre-structured
into the exact dimensions the judge scores**. The renderer surfaces a "Traps"
section, a "Non-obvious pick" section, a "Deepened" section with sketches. The
baseline, unprompted, returns prose.

A judge scanning for "did the output name traps?" will find a labelled "Traps"
section in ADHD and have to infer trap-ness from prose for the baseline. This
is structural, not substantive.

Fix path: either prompt the baseline with the same section labels (steel-man
the baseline), or instruct the judge to extract dimension content regardless
of formatting before scoring. Phase 0 should at minimum make the judge prompt
explicitly require dimension-by-dimension extraction.

### 3.3 Same-model judge / generator

Generator and judge are both `claude_code` preset (same model family, often
same checkpoint). Same-model judging systematically over-rates outputs whose
phrasing matches the judge's own distribution. Both ADHD and baseline are
Claude outputs, so this hits both, but it likely hits ADHD harder because the
diverge prompts push generation away from the model's default voice, while
the baseline prompt invites it.

Fix path: out of scope for Phase 0 (would need a different model for the
judge). Document the bias and revisit later.

### 3.4 Judge noise (single-call verdict)

Each problem is judged by exactly one LLM call. No replication. The eval's
`results.json` carries no measurement of how stable a verdict is — if the
same A/B pair were rejudged 5 times, we don't know whether the winner is the
same 5/5 times or 3/5.

Fix path: task 0.2 (3 reruns to measure flip rate) and the checkpoint rule
(switch to best-of-3 majority if >20% of verdicts flip).

### 3.5 Small N

6 problems. With a binomial sign test, 5W/1L is only `p ≈ 0.11` — not
significant at α=0.05. The published "wins 5 of 6" headline is suggestive but
not statistically loadbearing.

Fix path: task 0.7 (expand to ≥15).

### 3.6 Category imbalance

Each of the 6 problems is from a different category. There is no
within-category replication — we cannot say "ADHD is good at debugging" from
one debugging problem. The current set tests breadth-of-applicability, not
within-category reliability.

Fix path: task 0.7 should include ≥2 problems per category.

### 3.7 No human anchor

There is no ground truth. The eval is LLM-judging-LLM with no calibration
against human preference. If the judge has systematic taste flaws (e.g. it
always rewards listing more options regardless of quality), every result in
`EVALS.md` reflects those flaws and we won't see it.

Fix path: task 0.6 (human-rated calibration subset + agreement metric).

### 3.8 No cost / latency capture

`results.json` records the outputs and the verdict but not token counts, USD
spent, or wall-clock time. We cannot answer "is ADHD's win rate per dollar
better than baseline's?" — a critical question for "do I run this skill at
all" decisions.

Fix path: task 0.8.

### 3.9 No duplication metric

ADHD's premise is "many distinct angles." If 30% of the surfaced ideas are
near-duplicates of each other (different phrasings of the same angle), the
breadth claim is hollow. We don't currently measure this.

Fix path: task 0.9 measures it now; Phase 2 task 2.2 implements dedup.

### 3.10 Score-aggregation skew

`writeReport()` averages 0–10 scores arithmetically across problems. If the
judge tends to give either floor (0–2) or ceiling (8–10) scores rather than
spread across the range, the means are pulled toward whichever pole is
hit more often. We do not currently inspect the score distribution.

Fix path: out of scope for tasks 0.1–0.11, but worth flagging — `bench/AUDIT
v2` should include a score-distribution histogram per dimension.

### 3.11 Renderer noise injected into judging

The judge receives `renderText(result)` with ANSI stripped — a string that
includes layout characters (`▸`, `◎`, `—`), section headers, and score chips
like `[N7 V8 F6]`. Score chips in particular leak the *generator's own
self-rating* into what the judge sees. The judge is implicitly being told
"this generator thought idea X was novelty 7" before forming its own opinion.

This is a real leakage path that hasn't been called out before. It both
inflates the judge's `novelty` confidence (anchoring) and creates a
self-rating-vs-judge-rating correlation that isn't independent evidence.

Fix path: strip score chips before judging, or render a chip-less variant
specifically for eval purposes. Add this to task 0.4 (length-controlled
judging is the closest task; sanitization belongs in the same pass).

### 3.12 The baseline is undermotivated

The baseline system prompt is generic. A more aggressive baseline ("give me
6 distinct approaches under different framings, then pick one and explain the
risk") would close most of the breadth gap without doing parallel calls. The
current baseline therefore measures **ADHD vs lazy-baseline**, not
**ADHD vs strong-baseline**. The headline win number is upper-bounded by how
weak the baseline prompt is.

Fix path: out of scope for Phase 0 (the plan freezes a baseline against the
current code unchanged). Flag for a later phase: add a "strong baseline" arm
that gets the same problem-shape priming, and judge ADHD against the
*stronger* of the two baselines.

---

## 4. What is currently *not* recorded per run

For each problem in `results.json` we currently have:
- problem text + id + category
- the `swapped` boolean
- both raw outputs as strings
- the `Verdict` object

We do **not** have:
- output token counts (per output)
- input token counts (per call: divergence, score, cluster, deepen, baseline, judge)
- USD cost (per problem and per run)
- wall-clock latency (per call and per problem)
- which frames were selected for this run
- raw ADHD intermediate state (ideas before scoring, scores, cluster labels)
- judge self-consistency (we don't rejudge)
- duplication rate within the ADHD wide set
- the git SHA the run was against
- the model identifier the run used

Phase 0 tasks 0.3, 0.8, 0.9, and 0.10 fill these gaps.

---

## 5. The judge prompt, verbatim

For reference. Lives at `bench/judge.ts:25–39` (system) and `bench/judge.ts:47–69`
(user). Changing this prompt is the lever for tasks 0.4 and 0.5.

System:

```
You are a skeptical staff engineer reviewing two ideation outputs (A and B)
for the same problem. Your job is to score them on the dimensions of open-ended
design work, not on prose polish.

You do NOT know which system produced which output. Score on substance only.

Rubric (each dimension 0-10):
- breadth: range of structurally DISTINCT angles. 10 minor variations of one idea = low breadth.
- novelty: how many ideas are non-obvious-but-viable. The obvious textbook answer is NOT novel.
- trap_detection: does it name ideas that look good but are traps, with reasons?
- actionability: does the top recommendation have a sketch, named risk, and first concrete step?
- builder_usefulness: if you were the engineer who had to ship, which is more useful to you?

Then declare overall_winner: "A", "B", or "tie".
Output JSON only. No prose preamble.
```

User-prompt skeleton:

```
PROBLEM:
{problem}

OUTPUT A:
{outputA}

---

OUTPUT B:
{outputB}

---

Score both on the rubric. Output JSON of shape: { ... }
```

---

## 6. Summary — the headline gaps Phase 0 must close

In rough priority order:

1. **Length and format-asymmetry bias** drive most of the published delta —
   the trap-detection 5.2× ratio in particular. Tasks 0.3, 0.4.
2. **No judge-noise measurement** — every published verdict is one sample.
   Task 0.2.
3. **N=6 with no within-category replication** — not statistically
   loadbearing. Task 0.7.
4. **No human anchor** — we are calibrating one LLM with another.
   Task 0.6.
5. **No cost/latency capture** — "is the 5–10× LLM call cost worth it"
   cannot currently be answered. Task 0.8.
6. **Renderer leaks self-rating into the judge's view** (newly identified) —
   strip score chips before judging. Fold into 0.4.

Out-of-scope for Phase 0 but worth queueing:
- Strong-baseline arm
- Different-model judge to break same-model bias
- Score-distribution histograms
