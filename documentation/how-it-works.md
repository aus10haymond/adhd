# How ADHD works

[← back to README](../README.md)

A two-phase loop with a hard wall between the phases. Mixing them is what kills idea quality, because the critic strangles the generator.

## Phase 1 — Diverge (ADHD mode)

Pick N **cognitive frames** from the [frame library](./frames.md). Spawn N **parallel** Agent SDK queries, each one a fresh isolated session.

Each branch sees:
- the problem
- *one* frame's vantage prompt (e.g. *"You think in latency, memory layout, and physical constraints. Re-ask this as a hardware problem."*)
- a system prompt that **forbids evaluation, ranking, or hedging** — pure generation, JSON array out, no prose.

Critically: branches **do not see each other**. The "regulator" branch never reads what the "speedrunner" branch wrote. No anchoring, no shared context, no convergence pressure.

## Phase 2 — Focus

Now the critic comes back online. Three passes:

1. **Score** every leaf on `novelty / viability / fit`. Tag traps with reasons.
2. **Cluster** by underlying angle, not surface keywords ("remove-the-server plays", "cache-shaped plays") — surfaces the *shape* of the space.
3. **Deepen** top-K: sketch how it works, name the load-bearing risk, name the first concrete step, generate 3–5 child ideas (variations, hybrids, unlocks).

Output:
- the wide set, clustered
- a 2–4 idea shortlist
- the **non-obvious-but-viable pick** flagged explicitly
- the trap list, each trap with the reason it's a trap
- the deepened branches — the "connected dots"
- one provocation (a wildcard question)

---

## Architecture — the mechanism, not the metaphor

For researchers and infra folks.

### Context-window management

Each divergent branch is its own `query()` call against the [Claude Agent SDK](https://docs.claude.com/en/api/agent-sdk) — a fresh, **stateless session** with no shared KV-cache, no shared message history, no shared system prompt beyond the `claude_code` preset. The only tokens that enter a branch are:

```
system  = preset + frame_vantage_prompt + "forbid evaluation/ranking/hedging, JSON array out"
user    = problem + optional_context
```

Token cost scales **linearly** in branches (`O(N × per_branch)`), not quadratically — there's no broadcast of prior branches into later ones. The "ADHD" fan-out is true concurrent inference, not interleaved decoding on a shared trajectory. See [`src/llm.ts`](../src/llm.ts) and [`src/diverge.ts`](../src/diverge.ts).

### Pruning & convergence criteria

Convergence is a **separate LLM call** with an inverted system prompt (critic posture, evaluation mandatory). It performs three structured passes — see [`src/score.ts`](../src/score.ts), [`src/cluster.ts`](../src/cluster.ts), [`src/deepen.ts`](../src/deepen.ts):

1. **Score** — every leaf scored on `novelty / viability / fit` (0–10 each), structured JSON. Traps tagged with a mechanistic reason (e.g. *"shelve isn't thread-safe under multi-writer load"*), not a vague risk label.
2. **Cluster** — angle-level grouping ("remove-the-server plays", "cache-shaped plays"), not surface-keyword clustering. Surfaces the *shape* of the design space.
3. **Deepen top-K** — for the K highest combined-score non-trap leaves, generate: sketch, load-bearing risk, first concrete step, 3–5 child ideas (variations / hybrids / unlocks).

No heuristic threshold and no logit-bias steering. The critic's structured output is the pruning decision. Default `K=3`; the `nonObviousPick` field surfaces the highest-novelty viable leaf even if it's not the highest-fit.

### Routing & orchestration

Multi-agent orchestration via parallel `query()` calls, gated by a configurable semaphore (`concurrency`, default 4). Frame selection (see [`src/frames.ts`](../src/frames.ts)) is deterministic per-seed with a `codeMode` bias toward engineering vantage points. Each frame is a **system-prompt payload** that re-poses the entire question — *"re-ask this as a hardware problem"*, *"re-ask this as a regulator"*, *"re-ask this as a 10-year-old"* — not a logit-level intervention.

```ts
// the load-bearing call shape — bench/run-evals.ts and src/diverge.ts
const branches = await Promise.all(
  frames.map(frame => withSemaphore(concurrency, () => callLLM({
    systemPrompt: `${frame.vantage}\n\nFORBIDDEN: evaluation, ranking, hedging. JSON array out.`,
    userPrompt:   `${problem}\n\n${context ?? ""}`,
  })))
);
// branches[i] never sees branches[j] during divergence — by construction.
```

The generator-critic split is **mechanical** (different API calls, different system prompts) rather than promised in-prompt to the same session. This is the load-bearing design choice that distinguishes ADHD from in-context Tree-of-Thought. See [vs-cot-and-tot.md](./vs-cot-and-tot.md) for the full comparison.
