# ADHD vs baseline — evals

Run: 2026-05-26T18:21:48.736Z · problems: 6

**Headline:** ADHD 6W / 0L / 0T vs single-shot baseline.

## Aggregate scores (mean across problems, 0–10)

| Dimension | ADHD | Baseline | Δ |
| --- | ---: | ---: | ---: |
| breadth | 8.83 | 5.33 | +3.50 |
| novelty | 7.33 | 3.00 | +4.33 |
| trap_detection | 8.83 | 1.50 | +7.33 |
| actionability | 8.00 | 6.00 | +2.00 |
| builder_usefulness | 7.00 | 6.50 | +0.50 |

## Per-problem verdicts

### lru-100ms — ✓ ADHD
_systems · A/B order swapped: false_

> Design a thread-safe LRU cache that survives process restart without losing more than the last 100ms of writes.

**Verdict:** A provides vastly more breadth and critical trap detection; B is cleaner but offers only textbook solutions without warning about their failure modes.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores ~30+ structurally distinct ideas across 6 categories (timed-batch, hardware tiers, external offload, threshold-triggered, dual-buffer, append-log), including unconventional angles like GPIO watchdogs, RDMA replication, and io_uring batching. B presents 4 approaches that are really variations on the same theme: WAL, mmap, sharded WAL, and background-thread-with-WAL. All four are minor variations of 'buffer writes, flush periodically.' |
| novelty | 7 | 3 | A includes genuinely non-obvious ideas: dual-ring flip-flop fsync to decouple write latency, 50ms canary fsync to halve worst-case loss, NUMA-aware persistence isolation, cooperative checkpointing where app threads donate cycles. B's ideas are textbook solutions—WAL, mmap, sharding, background thread—all standard patterns found in any database internals course. |
| trap_detection | 9 | 2 | A explicitly identifies 18 traps with specific technical reasons: mmap without fsync loses pages, fork causes CoW page fault storms, Optane is EOL'd, threshold-based flushing misses low-write workloads, Redis everysec is 1000ms not 100ms. B mentions edge cases (crash during flush, disk full) but doesn't identify which approaches look good but fail—notably doesn't warn that mmap's msync timing is OS-dependent or that their 'very fast recovery' claim for mmap is false without explicit fsync. |
| actionability | 8 | 6 | A provides concrete first steps ('implement 32-byte aligned log record format, verify append throughput exceeds ops/sec by 10x'), names specific load-bearing risks (fsync latency spikes, ring buffer overflow), and gives implementation details (SPSC queue, cache-line padding). B has a recommendation with bullet points but lacks specificity—'use lock-free MPSC queue' without sizing, 'fsync on timer' without addressing what happens when fsync exceeds 100ms. |
| builder_usefulness | 7 | 6 | A's depth is valuable for an engineer who needs to understand failure modes and pick the right tradeoffs, but the gaming metaphors (bonfire, permadeath, combo meter) add noise. B is cleaner and more immediately implementable with its comparison matrix and clear recommendation, but an engineer would hit the traps A warns about (especially the mmap timing issues). A saves you from mistakes; B gets you started faster but with hidden landmines. |

### llm-hang-cli — ✓ ADHD
_ux/reliability · A/B order swapped: false_

> We have a CLI that calls an LLM and the LLM sometimes hangs for 90 seconds before responding. Design the right retry/timeout/UX strategy.

**Verdict:** A is a creative design exploration with exceptional trap detection but requires synthesis; B is a practical implementation guide with textbook solutions ready to ship.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 4 | A explores 30+ structurally distinct angles across 6 categories (early-detection, user-tradeoff, graceful-degradation, async-queue, parallel-racing, speculative-prefetch). B covers 3 main areas (timeout strategy, retry strategy, UX) with minor variations within each. A's categories span wildly different solution spaces; B stays within conventional retry/timeout territory. |
| novelty | 8 | 2 | A surfaces genuinely non-obvious ideas: TCP packet timing detection for early abort, 'skip cutscene' UX metaphor, timeout auctions, combo meters, futures contract UX. Many are creative even if impractical. B presents textbook solutions (graduated timeouts, exponential backoff with jitter, spinner with elapsed time) that any senior engineer would immediately suggest. Nothing in B would surprise someone who's built retry logic before. |
| trap_detection | 9 | 1 | A explicitly lists 17 traps with specific reasons why each fails (e.g., 'fever response is backwards—you need longer timeouts when stressed', 'gut flora redundancy doubles cost', 'prefetching burns credits on wrong guesses'). This is exceptional trap analysis. B mentions exactly one trap-like concern ('silent waiting is the biggest mistake') but doesn't systematically identify ideas that look good but aren't. |
| actionability | 8 | 7 | A's deepened branches include concrete implementation sketches (AbortController + setTimeout race wrapper, TimeoutAuction class with Promise.race chains), named load-bearing risks (prompt compatibility, cache staleness, false positives), and explicit first steps. B provides a concrete config YAML, code snippet for token timeout, and clear UX flow example. Both are actionable, but A's risk-naming is more explicit. |
| builder_usefulness | 7 | 8 | B is immediately implementable with copy-paste-ready code patterns, specific timeout values, and a clear recommendation section. A builder could ship B's approach in an afternoon. A requires more synthesis—the ideas are richer but need translation into implementation. A is better for design exploration; B is better for 'I need to ship this today'. For a CLI that needs a working solution, B's practicality edges out A's creativity. |

### rate-limit-leader — ✓ ADHD
_distsys · A/B order swapped: true_

> Design a rate limiter that stays correct across a leader election. Existing leader had counters in memory; new leader takes over with no warning.

**Verdict:** A provides solid textbook solutions ready to implement; B offers genuinely novel framings with extensive trap detection, but requires more translation work for production use.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 6 | A covers 6 approaches but they're variations on a standard taxonomy (external store, consensus, replication, handoff, logging, degraded mode). B explores radically different structural angles: financial trading metaphors (market maker, futures, auctions), game mechanics (fog of war, guild ledger, respawn cooldowns), biological systems (ant trails, pheromones), client-carried state, and adversarial exploitation. B has genuinely distinct mental models, not just implementation variants. |
| novelty | 7 | 3 | A's approaches are textbook distributed systems patterns - Redis external store, Raft consensus, graceful handoff, WAL replay. These are the first things any experienced engineer would consider. B introduces genuinely non-obvious framings: 'stale quote spread' borrowing from market-making under uncertainty, 'fog of war' pessimistic recovery from games, client-carried signed tokens, and emergent swarm behaviors. The market maker analogy is particularly insightful for handling uncertainty gracefully. |
| trap_detection | 8 | 2 | A mentions tradeoffs inline but doesn't explicitly call out traps - things that look good but fail. B has a dedicated Traps section with 17 explicitly flagged dangerous-looking ideas with specific reasons why each fails (e.g., 'two-phase commit requires cooperation from old leader—problem states no warning so old leader may be dead'). B also correctly identifies its own adversarial plays as attack vectors not solutions, showing self-awareness. |
| actionability | 8 | 7 | A's recommendation has a clear architecture diagram and degradation strategy but lacks concrete first steps. B's deepened branches include specific implementation details: 'CheckpointWriter goroutine that serializes per-client counters to etcd every N milliseconds with monotonic sequence number', 'LeaderConfidenceState struct tracking (election_timestamp, observed_request_count, anomaly_count, current_spread_multiplier)', and 'Lua script for Redis that atomically increments'. B names concrete risks (checkpoint staleness gap, spread tuning curve) more precisely. |
| builder_usefulness | 6 | 7 | A is more immediately implementable - the Redis + graceful handoff + degraded fallback recommendation is production-ready advice with clear code sketches. An engineer could ship this tomorrow. B is more useful for design exploration and edge case thinking but requires more translation to production code. B's market maker and fog of war concepts need more engineering to become concrete. However, B's trap detection would prevent costly mistakes. |

### fuzzy-bug — ✓ ADHD
_debugging · A/B order swapped: false_

> 0.1% of API requests time out intermittently. No stack trace, no obvious pattern, no recent deploy. How should we investigate? Generate hypothesis classes, not specific fixes.

**Verdict:** A wins on novelty and exceptional trap detection; B is a competent but conventional playbook lacking explicit warnings about dead-ends.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 8 | 7 | A covers more structurally distinct angles with creative framing (autoimmune/self-defense mechanisms, temporal correlation, dirty-hands debugging, resource exhaustion). B hits the standard categories well (resource exhaustion, downstream deps, infrastructure, contention, timing) but they're more conventional groupings. A's 'self-inflicted defense mechanism' and 'autoimmune response' hypotheses are genuinely different lenses than B's standard taxonomy. |
| novelty | 7 | 4 | A surfaces non-obvious ideas like rate limiters attacking legitimate traffic, circuit breaker timing collisions, retry amplification cascades, and health check cannibalism. B is a competent textbook answer—connection pools, GC pauses, batch jobs, downstream latency—all correct but entirely predictable to any senior engineer. A's 'autoimmune' framing leads to genuinely different investigation paths. |
| trap_detection | 9 | 1 | A explicitly calls out 11 traps with specific reasoning (e.g., 'curl 100 times won't hit 0.1%', 'SSH during timeout is timing-impractical', 'binary search deps in prod is high-risk'). This is exceptional trap detection. B has zero explicit trap identification—no warnings about what might look promising but waste time. |
| actionability | 8 | 6 | A's top recommendation (autoimmune hypothesis) has a concrete first step ('instrument every rate limiter, circuit breaker, and retry policy to emit distinct metric/log'), names the load-bearing risk ('minimal logging because working as intended'), and provides a sketch of what to look for. B provides a table of phases and 'recommended starting points' but they're generic guidance (distributed tracing, correlation analysis) without the same depth of reasoning about risks and specific instrumentation. |
| builder_usefulness | 7 | 7 | Both are useful but for different engineers. B is immediately actionable for someone who wants a checklist—the table format and 'key questions to answer first' are pragmatic. A is more useful for an engineer who has already checked the obvious things and needs fresh angles. A's depth on the autoimmune hypothesis and invisible walls would unlock new investigation paths. B would get you started faster but might not help when standard approaches fail. |

### monolith-split — ✓ ADHD
_refactor · A/B order swapped: false_

> We have a 200k-line Rails monolith. The team wants to split it. Generate strategies for how to decompose it — by domain, data, team, churn, or otherwise.

**Verdict:** A provides significantly more breadth, novelty, and critical trap detection despite being denser; B is a competent but textbook treatment of standard decomposition strategies.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A covers 6 distinct categories (dependency analysis, runtime observation, incremental extraction, governance friction, compliance boundaries, boil-the-ocean rewrites) with 30+ structurally different ideas including hardware metaphors, chaos engineering, and formal methods. B covers 6 standard approaches (DDD, data coupling, Conway's law, churn, strangler fig, Packwerk) that are the textbook answers you'd find in any microservices decomposition guide. |
| novelty | 7 | 3 | A includes genuinely non-obvious ideas: network partition injection to reveal coupling, compliance-boundary decomposition, retention-policy-based splitting, PCB trace routing metaphor, read-replica as instant microservice. B's approaches are all well-documented standard industry practices—DDD bounded contexts, strangler fig, Packwerk, churn analysis are covered in virtually every microservices migration talk. |
| trap_detection | 9 | 1 | A explicitly lists 16 traps with specific reasoning for why each attractive-looking idea fails (e.g., 'fattest model is fat because it's coupled everywhere', 'table-per-service creates distributed monolith', 'TLA+ modeling takes longer than rewriting'). B has zero explicit trap warnings—only generic 'Cons' columns in tradeoff tables without calling out ideas that seem good but are actually dangerous. |
| actionability | 8 | 6 | A's 'Focus' section provides detailed implementation sketches for top picks including concrete first steps (grep/AST scan for PCI columns, add retention_policy class method), named risks (data spanning compliance domains, hidden has_many :through joins), and follow-on branches. B provides high-level execution steps but they're generic ('map models to business capabilities', 'generate dependency graph') without named risks or concrete validation steps. |
| builder_usefulness | 7 | 6 | A gives more to work with for an experienced engineer—the trap detection alone saves weeks of false starts, and the compliance-boundary framing is genuinely useful for regulated industries. However, A's density and hardware metaphors can be overwhelming. B is cleaner and more immediately digestible, with the phased recommendation being reasonable, but it won't help you avoid common pitfalls or discover non-obvious approaches. |

### naming-feature-flag — ✓ ADHD
_naming · A/B order swapped: false_

> Generate names for a feature-flag service that supports gradual rollout, kill-switches, and per-tenant overrides. The name should signal control and reversibility.

**Verdict:** A delivers a rigorous ideation process with novel frames, explicit trap analysis, and implementation sketches; B is a competent but shallow brainstorm list.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 8 distinct conceptual frames (fortress, mechanical, undo, circuit-breaker, ant-colony, biological-signaling, trading-exchange, tenant-control) with multiple variations in each. B covers 4 frames (control, reversibility, gradual rollout, combined) but these overlap heavily—Throttle/Valve/Dial/Dimmer/Ramp are all 'analog dial' variations. A's biological-signaling and trading-exchange angles are structurally distinct from each other and from the obvious mechanical metaphors. |
| novelty | 8 | 3 | A surfaces non-obvious but viable ideas: Quorum (bacterial threshold sensing mapping to percentage rollout), Apoptosis (programmed death—flagged as trap but shows creative range), FeatureExchange/ToggleFutures (financial market framing). B's suggestions are textbook-obvious: Switchboard, Toggle, Gatekeeper, Circuit are the first things anyone would think of. Helm is the only mildly interesting one, and B notes it conflicts with K8s Helm. |
| trap_detection | 9 | 2 | A explicitly lists 18 traps with specific reasons: Trapdoor implies one-way (opposite of reversibility), Apoptosis has death connotation, two-word names break package imports, Cytokine is unspellable. B only mentions 'helm conflicts with K8s Helm' and 'check for conflicts' generically—no analysis of why Gatekeeper sounds security-blocking or why Toggle is already taken by a major competitor (LaunchDarkly alternative named Toggle). |
| actionability | 8 | 4 | A's Focus section gives concrete implementation sketches: Flag schema fields for Drawbridge, Redis backend + /flags/:id/kill endpoint for Canary Gate, Quorum interface with hasQuorum() and setThreshold() methods. Each names a load-bearing risk and first concrete step. B gives CLI ergonomics advice but no schema, no API shape, no first implementation step. 'Check domains early' is generic advice, not a concrete step. |
| builder_usefulness | 8 | 5 | As a builder, A gives me starting points I can code against: Flag schema with rollout_percentage and tenant_overrides[], API methods like hasQuorum(). The trap analysis saves me from embarrassing myself with names like Apoptosis. B gives me a reasonable shortlist but I'd still need to do all the thinking about implementation, traps, and why each name works for the specific requirements (gradual rollout, kill-switch, per-tenant). B's 'Naming Considerations' are useful but generic. |

---

_Methodology: each problem run through ADHD (5 frames × 6 ideas, top-3 deepened) and a single-shot baseline using the same model. A/B order randomized per problem to balance positional bias. Judged by a separate LLM call with a skeptical-staff-engineer system prompt._

_Full transcripts: see `bench/results.json`._