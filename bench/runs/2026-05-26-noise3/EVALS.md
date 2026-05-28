# ADHD vs baseline — evals

Run: 2026-05-26T19:03:15.855Z · problems: 6

**Headline:** ADHD 6W / 0L / 0T vs single-shot baseline.

## Aggregate scores (mean across problems, 0–10)

| Dimension | ADHD | Baseline | Δ |
| --- | ---: | ---: | ---: |
| breadth | 8.83 | 5.33 | +3.50 |
| novelty | 7.17 | 3.33 | +3.83 |
| trap_detection | 8.83 | 2.00 | +6.83 |
| actionability | 7.67 | 6.33 | +1.33 |
| builder_usefulness | 7.17 | 6.00 | +1.17 |

## Per-problem verdicts

### lru-100ms — ✓ ADHD
_systems · A/B order swapped: true_

> Design a thread-safe LRU cache that survives process restart without losing more than the last 100ms of writes.

**Verdict:** B provides dramatically broader exploration with extensive trap detection and concrete first-steps, while A offers competent but textbook solutions without identifying pitfalls.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A covers 4 main approaches (WAL, mmap shadow paging, hybrid with RocksDB, replication) which are fairly standard categories. B explores 6+ distinct categories (hardware-persistence, mmap, write-segmentation, batched-flush, durability-guarantees, external systems) with multiple structurally different ideas in each. B's ideas span hardware solutions, time-windowing, batching strategies, and offloading—genuinely different angles rather than variations. |
| novelty | 7 | 3 | A's approaches are textbook solutions—WAL with snapshots, mmap, embedded KV store, replication. These are well-documented patterns. B includes non-obvious ideas like partitioning into 10ms write windows for bounded recovery, pallet batching with manifest headers, supercapacitor flush circuits, and CLWB instruction tricks. While some of B's hardware ideas are impractical, several software ideas (time-windowing, adaptive pallet sizing) are genuinely novel-but-viable. |
| trap_detection | 9 | 2 | A briefly mentions 'why not the others' with surface-level dismissals ('too much complexity', 'overkill') but doesn't identify specific traps. B explicitly lists 18 traps with concrete reasons why each fails: mmap auto-sync has no 100ms guarantee, JSON serialization doesn't scale, Redis AOF is circular dependency, CLWB requires specific Intel hardware, dual-journal doubles write amplification, etc. B's trap section is exceptionally thorough. |
| actionability | 8 | 6 | A provides a recommendation with pseudocode, mentions sharding strategy, and includes durability math (50ms flush = <100ms loss). However, risks are generic ('crash during snapshot'). B's deepened branches include explicit first concrete steps (e.g., 'implement a lock-free MPSC ring buffer for the pallet accumulator'), named load-bearing risks (fsync latency variance, forklift thread dying silently), and specific mitigations (heartbeat watchdog at 75ms threshold). |
| builder_usefulness | 8 | 5 | A gives a solid starting point with proven patterns but doesn't help me avoid pitfalls or understand tradeoffs deeply. B's explicit trap detection saves me from wasting time on mmap-based solutions that don't actually guarantee 100ms durability, warns me about forklift thread failure modes, and provides branching variations (double-buffered swap, adaptive sizing) that address real operational concerns. B's structure—wide exploration, shortlist, traps, deep dives—mirrors how an experienced engineer actually thinks through design. |

### llm-hang-cli — ✓ ADHD
_ux/reliability · A/B order swapped: false_

> We have a CLI that calls an LLM and the LLM sometimes hangs for 90 seconds before responding. Design the right retry/timeout/UX strategy.

**Verdict:** A wins on ideation depth and trap detection despite B being more immediately implementable; A surfaces non-obvious approaches and explicitly warns against 16 seductive-but-broken ideas while B delivers the competent textbook answer.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 5+ structurally distinct categories (hedging/racing, perceived-wait UX, skip-the-call, learn-from-history, adaptive thresholds) with multiple variations each. B covers streaming, timeouts, retries, UX messaging, and hedging - solid but these are the standard playbook categories that any senior engineer would enumerate. A's 'inflammation signaling' and 'synaptic pruning' metaphors surface genuinely different structural approaches (system-wide mode shifts vs local retry logic). |
| novelty | 7 | 3 | B is essentially the textbook answer - streaming, tiered timeouts, exponential backoff with jitter, progressive UX. All correct, none surprising. A has genuinely non-obvious ideas: 'cytokine' events that shift the entire UI to degraded-but-responsive mode, tracking prompt/endpoint correlations to prune bad pathways, 'background mode becomes batch mode' as an unlock from the wait-state infrastructure. The 'scout request with cheaper model' is creative even if flagged as a trap. |
| trap_detection | 8 | 2 | A explicitly names 16 traps with specific reasons why each fails (3x cost, cache hit rate near zero, deceptive UX erodes trust, distributed infra for a CLI is overengineered). B mentions hedging '2x cost' tradeoff in passing but doesn't systematically identify approaches that look good but fail. No mention of common traps like aggressive caching being useless for LLM prompts, or silent retries being deceptive. |
| actionability | 7 | 8 | B provides a complete TypeScript implementation with specific timeout values, clear code structure, and is copy-paste ready. A provides first concrete steps ('instrument CLI to log latencies to SQLite', 'wrap fetch in raceWithHedging utility') and names load-bearing risks, but no runnable code. B's implementation sketch is more immediately actionable despite less strategic depth. |
| builder_usefulness | 6 | 7 | If I'm shipping tomorrow, B gets me 80% of the way with working code and sensible defaults. A is more useful if I'm designing the system architecture or anticipating edge cases - the trap detection alone saves debugging time. But A's biological metaphors (cytokines, inflammation, synaptic pruning) add cognitive overhead without proportional payoff for implementation. B's 'users tolerate slowness better than uncertainty' insight is just as actionable as A's framework. |

### rate-limit-leader — ✓ ADHD
_distsys · A/B order swapped: false_

> Design a rate limiter that stays correct across a leader election. Existing leader had counters in memory; new leader takes over with no warning.

**Verdict:** A provides substantially broader ideation with explicit trap detection and novel angles; B offers solid but conventional textbook solutions.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 7 distinct structural categories (replay/reconstruct, client-carries-proof, pessimistic-defaults, externalize-state, graceful-handoff, distribute-counting, probabilistic) with multiple variations each. B covers 5 approaches but they're more conventional buckets (external store, consensus, async replication, client-side tokens, sticky sessions). A's range includes non-obvious angles like 'scent decay', 'stamina fields', and 'foraging for tokens' that represent genuinely different structural thinking. |
| novelty | 7 | 3 | A surfaces several non-obvious ideas: embedding rate state directly in Raft log entries like CPU register context switches, epoch-scoped quota namespaces, JIT token allocation with bounded loss, and cryptographic epoch binding. B's approaches are textbook solutions (Redis, Raft, async replication) that any senior engineer would enumerate. B explicitly calls Redis 'the default choice' and acknowledges these are standard patterns. |
| trap_detection | 9 | 2 | A explicitly lists 14 traps with specific reasons why each fails (e.g., 'bus hold protocol' fails because the problem states 'no warning', 'scent decay math is fragile', 'clients have incentive to lie about wait time'). B mentions tradeoffs in passing (cons lists) but doesn't explicitly call out which seemingly-good ideas are actually traps. B's cons are operational concerns, not 'this looks good but will bite you' warnings. |
| actionability | 8 | 7 | A's top pick (Raft log embedding) includes a specific first step ('define the protobuf schema for RateLimitEntry with fields for idempotency key, token delta, and logical timestamp'), names the load-bearing risk (replay latency causing thundering herd), and sketches the implementation. B provides a clear architecture diagram and mentions 'write-through to Redis' with cache TTL tuning, but lacks the same depth on risks and concrete first implementation steps. |
| builder_usefulness | 7 | 7 | A is more useful for greenfield design and exploring the solution space thoroughly—great for architecture discussions and avoiding pitfalls. B is more useful for a team that needs to ship quickly with a proven pattern—the Redis+cache recommendation with the decision framework (over-allow vs over-block, latency budget, request rate) is immediately actionable. Different kinds of useful for different contexts. |

### fuzzy-bug — ✓ ADHD
_debugging · A/B order swapped: false_

> 0.1% of API requests time out intermittently. No stack trace, no obvious pattern, no recent deploy. How should we investigate? Generate hypothesis classes, not specific fixes.

**Verdict:** A wins on trap detection and novel framing (inversion, safeguard gaps) despite overwrought metaphors; B is a competent but standard SRE checklist.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 8 | 6 | A covers more structurally distinct angles: resource contention, circular dependencies, lazy initialization, inversion ('why does 99.9% succeed'), and stress testing. B covers the standard categories (infra, GC, downstream, request characteristics, client-side, locks, time-based) but these are more predictable SRE checklist items rather than distinct investigative frames. |
| novelty | 7 | 4 | A's inversion frame ('why do 99.9% succeed') is genuinely non-obvious and useful. The 'success fingerprint' approach and systematic gap analysis are creative. B's hypotheses are textbook SRE—experienced engineers would enumerate GC pauses, downstream latency, connection pools without prompting. The financial metaphors in A are overwrought but the core insight about inverting the question is valuable. |
| trap_detection | 9 | 2 | A explicitly labels 8 traps with specific reasons why they fail (100x replay changes timing characteristics, running prod at 99% creates real outages, building priority auctions is scope creep). B mentions one trap almost in passing ('Averages hide this') and has one 'Trap to avoid' note but no systematic trap identification. A's trap section is substantive and shows judgment. |
| actionability | 7 | 6 | A provides concrete first steps for its deepened branches (e.g., 'Add middleware that logs a structured resource readiness snapshot at request entry'). B gives a reasonable investigation order and the 'segment the data' advice is practical. However, A's top recommendation has more specific instrumentation guidance. B's recommendations are sound but more generic. |
| builder_usefulness | 7 | 6 | A would give an engineer more novel angles to try when standard approaches fail—the inversion frame and systematic safeguard audit are actionable and non-obvious. B is a solid starting checklist that a senior SRE would produce anyway. A's financial metaphors are noise but the signal-to-noise ratio is still acceptable. For a genuinely stumped engineer, A offers more 'what to try next' ammunition. |

### monolith-split — ✓ ADHD
_refactor · A/B order swapped: false_

> We have a 200k-line Rails monolith. The team wants to split it. Generate strategies for how to decompose it — by domain, data, team, churn, or otherwise.

**Verdict:** A delivers creative, non-obvious strategies with explicit trap detection; B provides a competent but textbook survey of standard decomposition patterns.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 6 distinct category clusters (ops-ownership, organic-discovery, compliance, gamification, formal-verification) with 30+ structurally different ideas spanning biological metaphors, legal discovery patterns, chaos engineering, and organizational incentives. B covers 6 approaches but they are the standard textbook decomposition strategies (domain, data, team, churn, strangler fig, modular monolith) that would appear in any microservices talk. |
| novelty | 8 | 3 | A includes genuinely non-obvious ideas: decomposing by subpoena patterns, using data retention policy as a forcing function, 'chaos cascade' isolation, neural pruning via production traffic co-activation. B's approaches are well-known industry standards—domain-driven design, strangler fig, Packwerk modular monolith, churn analysis—all of which are the first things any consultant would recommend. |
| trap_detection | 9 | 2 | A explicitly calls out 17 traps with specific reasoning (e.g., 'on-call rotations shift frequently; service boundaries shouldn't chase org chart churn', 'gamification distracts from actual architecture work', '5-year parallel run costs 2x infrastructure'). B has no trap detection section—it lists pros/cons but doesn't identify which appealing-sounding approaches are actually dangerous. |
| actionability | 8 | 7 | A's top recommendation includes concrete first steps (PagerDuty query correlating incident tags, SQL query for FK relationships), named risks (circuit breaker timeout tuning, foreign key problem with GDPR deletion), and branching implementation paths. B provides a clear 5-step action plan with specific tools (Packwerk, git log command) but lacks risk identification beyond generic tradeoff tables. |
| builder_usefulness | 7 | 6 | A gives an engineer more mental models and non-obvious angles to consider—the legal discovery insight alone could reframe how you think about boundaries. However, A's format is dense and requires synthesis. B is immediately executable with copy-paste commands and a clear recommendation, but offers less insight if the standard approaches don't fit your situation. |

### naming-feature-flag — ✓ ADHD
_naming · A/B order swapped: true_

> Generate names for a feature-flag service that supports gradual rollout, kill-switches, and per-tenant overrides. The name should signal control and reversibility.

**Verdict:** B wins by combining broader ideation with extensive trap detection, concrete implementation sketches, and named risks—transforming a naming exercise into actionable design guidance.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 6 | A covers 5 thematic categories with ~20 names, but many are variations on the same physical-control metaphor (valve/lever/throttle/dimmer). B explores 6 distinct conceptual territories including financial instruments, audit/provenance, uncertainty/conditional-state, and physics-based metaphors. B's range from 'FeatureFutures' to 'Pendulum' to 'Airlock' shows structurally different angles on the problem. |
| novelty | 7 | 4 | A's suggestions (Valve, Dimmer, Toggle, Gatekeeper) are solid but mostly obvious metaphors any engineer would reach for. B surfaces non-obvious ideas like Pendulum (features that decay back to safe state), Airlock (decompression chamber metaphor), and financial-instrument framings. The Pendulum concept of 'holding force required to maintain enabled state' is genuinely novel for feature-flag design. |
| trap_detection | 9 | 2 | A has one brief 'Avoid' paragraph mentioning namespace conflicts. B explicitly lists 18 traps with specific reasons: trademark collisions (Consensys, Tether), misleading metaphors (ConsentValve implies GDPR), overpromising (ProvableSwitch suggests formal verification), and unprofessional naming (Undo Button Land). This is substantially more useful for avoiding mistakes. |
| actionability | 8 | 4 | A gives a recommendation (Valve/Dimmer) with brief rationale and a CLI example, but no schema, no named risks, no concrete first step. B's Focus section provides detailed implementation sketches: DimmerFlag schema with specific fields, FeatureAirlock interface with method signatures, FeatureState class with decay functions. Each includes a 'load-bearing risk' and explicit 'first concrete step'. |
| builder_usefulness | 8 | 5 | As the engineer shipping this, A gives me a decent name shortlist I could present in a meeting. B gives me that plus: implementation sketches I can start coding from, risk analysis to inform my design, trap detection to avoid embarrassing namespace collisions, and branch-off variations (CircuitDimmer, AirlockLedger) that suggest extensibility paths. B is closer to a design doc than a brainstorm list. |

---

_Methodology: each problem run through ADHD (5 frames × 6 ideas, top-3 deepened) and a single-shot baseline using the same model. A/B order randomized per problem to balance positional bias. Judged by a separate LLM call with a skeptical-staff-engineer system prompt._

_Full transcripts: see `bench/results.json`._