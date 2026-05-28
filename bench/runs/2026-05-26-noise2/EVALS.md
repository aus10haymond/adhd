# ADHD vs baseline — evals

Run: 2026-05-26T18:43:13.520Z · problems: 6

**Headline:** ADHD 6W / 0L / 0T vs single-shot baseline.

## Aggregate scores (mean across problems, 0–10)

| Dimension | ADHD | Baseline | Δ |
| --- | ---: | ---: | ---: |
| breadth | 8.83 | 5.50 | +3.33 |
| novelty | 7.00 | 3.50 | +3.50 |
| trap_detection | 9.00 | 2.17 | +6.83 |
| actionability | 8.00 | 6.17 | +1.83 |
| builder_usefulness | 7.83 | 6.17 | +1.67 |

## Per-problem verdicts

### lru-100ms — ✓ ADHD
_systems · A/B order swapped: false_

> Design a thread-safe LRU cache that survives process restart without losing more than the last 100ms of writes.

**Verdict:** A provides broader exploration with extensive trap detection and creative variations; B is a solid textbook treatment with useful code but less novel insight.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 7+ structurally distinct categories (WAL, snapshots, mmap, SQLite/Redis, redundant processes, adaptive flush, even biological metaphors as provocations). B covers 4 approaches (WAL, mmap shadow paging, embedded DB, ring buffer) that are more conventional and less divergent. A's 'stress-test-failure-modes' and 'over-engineered-biology-metaphors' sections show willingness to explore unusual angles even if impractical. |
| novelty | 7 | 4 | A includes genuinely non-obvious ideas: fork-based COW snapshots, dual-file rotation with ops runbook automation, WAL with embedded Lua for replay transformation, chaos monkey mode baked into the cache. B sticks to textbook patterns (WAL+snapshot, mmap, embedded DB, ring buffer) - all solid but standard distributed systems fare. A's 'sequence break' framing and branch explorations show creative recombination. |
| trap_detection | 9 | 2 | A explicitly identifies 20+ traps with specific reasons: 'fsync every write kills throughput', 'everysec != 100ms', 'pickle is slow for large caches', 'shared memory doesn't survive reboot', 'quorum requires multiple nodes'. B mentions tradeoffs in tables but never explicitly warns 'this looks good but is a trap' - it presents cons neutrally rather than calling out seductive-but-broken patterns. |
| actionability | 8 | 7 | A provides concrete first steps ('implement the WAL append path with CRC32 per entry'), names load-bearing risks ('mmap'd index can become corrupted if process crashes mid-update'), and sketches implementation details. B provides a Python code sketch and architecture diagram which are useful, but less explicit about named risks and first concrete step. Both are actionable but A is more explicit about risk-first thinking. |
| builder_usefulness | 8 | 7 | A's explicit trap detection saves engineering time by steering away from dead ends. The 'debuggable at 3am with tail and hexdump' framing shows operational empathy. B's code sketch and architecture diagram are immediately usable starting points. A wins slightly because trap detection and the branching exploration would help a builder avoid rework, but B's concrete code is valuable for rapid prototyping. |

### llm-hang-cli — ✓ ADHD
_ux/reliability · A/B order swapped: false_

> We have a CLI that calls an LLM and the LLM sometimes hangs for 90 seconds before responding. Design the right retry/timeout/UX strategy.

**Verdict:** A wins on breadth, novelty, and trap detection with its exhaustive creative exploration; B is cleaner but covers only standard approaches.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores ~25+ structurally distinct angles across 9 categories (parallel racing, adaptive learning, preemptive warming, playful UX, stale-serving, early detection, async architecture, hard guardrails, escape hatches). B covers 4 main approaches (progressive timeout, streaming, speculative retry, adaptive timeout) which are the standard textbook categories for this problem. |
| novelty | 7 | 3 | A includes genuinely non-obvious ideas: 'stench' marking for endpoints, swarm visualization, graduated bark-then-bite watchdog pattern borrowed from hardware NMI, colony-based adaptive thresholds. B's ideas are well-known patterns - streaming heartbeats, speculative retry, adaptive timeouts, and progressive user prompts are all standard industry practice. |
| trap_detection | 9 | 4 | A explicitly lists 17 traps with specific reasons why each fails (3x cost, stale cache useless for context-dependent LLM, randomized timeouts break debugging, LLM outputs aren't mergeable, etc.). B mentions a few tradeoffs inline (❌ markers) but doesn't systematically identify ideas that look good but are traps - it presents approaches neutrally rather than warning against seductive bad ideas. |
| actionability | 8 | 7 | A's top recommendation (graduated watchdog) includes a concrete first step (instrument HTTP client to emit event at 15s with zero bytes), names the load-bearing risk (thundering herd under load), and provides implementation sketch. B also has concrete details (state machine names, code snippets, specific timeout values) but the 'first step' is less precise - it's more of a general architecture description than a single actionable starting point. |
| builder_usefulness | 7 | 7 | A provides richer exploration space and more creative options to consider, plus explicit trap warnings that save engineering time. B provides a cleaner, more immediately implementable recommendation with actual code patterns and a clear state machine. A builder might prefer A for design phase and B for implementation phase - both have clear value. |

### rate-limit-leader — ✓ ADHD
_distsys · A/B order swapped: true_

> Design a rate limiter that stays correct across a leader election. Existing leader had counters in memory; new leader takes over with no warning.

**Verdict:** B provides significantly broader exploration, explicit trap detection, and deeper development of novel approaches, while A offers a solid but conventional treatment of standard solutions.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 6 | A covers 6 distinct approaches (Redis, Raft, sticky sessions, probabilistic recovery, client tokens, hybrid checkpoints). B covers ~20+ structurally distinct ideas across 6 major categories (checkpoint plays, distributed quota, graceful degradation, durable writes, client-held state, eliminating counters entirely). B includes unconventional angles like hardware dongles, proof-of-work, quorum sensing, and CRDT-based sidecars that A doesn't touch. |
| novelty | 7 | 4 | A's approaches are well-known production patterns - Redis counters, Raft replication, and client tokens are standard textbook solutions. B includes genuinely non-obvious ideas: 'gut flora' sidecars that survive elections, chained tickets with tamper-evident logs, VDFs for replay protection, CRDT-based rate limiting without leader involvement, and adversarial sidecar auditing. Many of B's ideas are unusual recombinations. |
| trap_detection | 9 | 2 | A mentions tradeoffs inline but doesn't explicitly call out trap patterns. B dedicates a substantial section to 17 explicitly labeled traps with specific failure reasons: 'Outgoing leader often has no warning to palletize anything', 'JIT allocation shifts latency to request path and creates thundering herd', 'Compensating post-election doesn't prevent burst abuse during amnesty window'. This is systematic trap analysis. |
| actionability | 8 | 7 | A provides a concrete Redis MULTI/INCR/EXPIRE code snippet and clear recommendation hierarchy. B's 'Focus' section goes deeper: defines exact ticket schema fields (client_id, window_epoch, counter, limit, signature), specifies HMAC-SHA256, identifies the load-bearing risk (replay attacks), and gives a concrete first step (protobuf schema + sign/verify functions). B also provides implementation sketches for sidecar and gossip approaches with specific first steps. |
| builder_usefulness | 8 | 7 | A is a solid reference doc that gives you the standard Redis answer with reasonable alternatives. An engineer could ship with A's guidance. B is more useful for serious design work: it maps the solution space more completely, explicitly warns you away from traps you might otherwise explore, and develops multiple viable paths in enough depth to actually implement. The branch-off ideas in B help you anticipate follow-on problems. |

### fuzzy-bug — ✓ ADHD
_debugging · A/B order swapped: false_

> 0.1% of API requests time out intermittently. No stack trace, no obvious pattern, no recent deploy. How should we investigate? Generate hypothesis classes, not specific fixes.

**Verdict:** A provides deeper, more novel investigation angles with explicit trap warnings, while B is a competent but conventional checklist.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 8 | 6 | A covers more structurally distinct angles including kernel-level issues, virtualization/NUMA effects, timing alignment, and explicitly separates 'impractical omniscient' approaches. B covers the standard categories (resource contention, network, dependencies, request characteristics, time-based, observability) but these are more conventional groupings. A's 'warehouse dwell time' vs 'last mile' vs 'batch shipment' framing reveals genuinely different mental models for the same problem space. |
| novelty | 7 | 4 | A introduces non-obvious framings like 'queue position at arrival' convoy effects, 'client-side backpressure as doorstep failure', TCP FIN/ACK race conditions appearing as false timeouts, and the insight that timeouts may fire before business logic executes (no stack trace because nothing ran). B's hypotheses are textbook correct but unsurprising - GC pauses, connection pool exhaustion, downstream latency are exactly what any senior engineer would list first. |
| trap_detection | 9 | 2 | A explicitly lists 11 traps with specific reasons why each looks good but fails (DNS usually causes >0.1%, MTU issues are consistent not random, NUMA effects are per-CPU-pinning not intermittent, full context capture adds latency affecting the problem). B has no explicit trap detection section - it mentions a 'breadth vs depth' tradeoff but doesn't warn against specific attractive-but-wrong hypotheses. |
| actionability | 8 | 6 | A provides concrete first steps for each deepened branch (e.g., 'add timestamp logging at thread pool acquisition and correlate with existing timeout logs'). It names specific risks ('queue instrumentation itself adds latency'). B provides a phased table which is useful but more generic - 'add request-scoped timing' is sound but less specific than A's 'measure time from request accept to handler invocation'. |
| builder_usefulness | 8 | 6 | A gives me investigation paths I wouldn't have thought of (reverse instrumentation from client side, 'dark cron' detection via resource anomaly scoring, adaptive timeout budgets that subtract dwell time). The branch-off structure shows how findings unlock next investigations. B is a solid checklist I could have written myself in 10 minutes - useful as a starting point but doesn't expand my thinking. A would save me from going down several blind alleys (the trap list) and suggests creative angles I'd actually try. |

### monolith-split — ✓ ADHD
_refactor · A/B order swapped: true_

> We have a 200k-line Rails monolith. The team wants to split it. Generate strategies for how to decompose it — by domain, data, team, churn, or otherwise.

**Verdict:** A is a competent textbook summary; B is a staff engineer's working document with novel angles, explicit traps, and mechanical first steps.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 6 | A covers 6 standard decomposition strategies (domain, data, team, churn, strangler fig, packwerk) which are the canonical approaches. B generates 30+ distinct ideas across 6 categories including compliance-driven splits, topology plays, social heuristics, and naive approaches. B explores angles A doesn't touch: regulatory jurisdiction splits, write chokepoints, 'returns desk' patterns, policy enforcement gateways, and deliberately counterintuitive plays like extracting cold code first. |
| novelty | 7 | 3 | A's strategies are textbook—any senior Rails dev would list domain-driven, strangler fig, and packwerk. B includes genuinely non-obvious ideas: JIT extraction (only split when sprint demands it), transaction-boundary-as-boundary analysis, assigning services to teams that touch them least, 'returns desk' for failed calls, and splitting by data classification tier. Several B ideas made me pause and think 'huh, that's interesting.' |
| trap_detection | 9 | 2 | A mentions tradeoffs for each strategy but doesn't explicitly call out traps or ideas that look good but aren't. B dedicates a full section to 18 named traps with specific reasoning for each—e.g., why extracting hot files first maximizes disruption, why PII extraction creates massive API surface, why event sourcing is a 'prerequisite tax' not a decomposition strategy. This is exactly what a skeptical staff engineer would want. |
| actionability | 8 | 7 | A provides a phased hybrid recommendation with a timeline table, tool suggestions, and clear first steps (install packwerk, analyze churn). B's 'Focus' section deepens 3 shortlisted ideas with specific first steps (write a Rubocop AST visitor, Rake task to parse schema.rb, instrument deployment pipeline). Both are actionable, but B's first steps are more mechanically specific while A's are slightly more hand-wavy ('identify 2-3 extraction candidates'). |
| builder_usefulness | 8 | 6 | A is a solid primer I'd share with a junior engineer learning decomposition patterns. B is what I'd actually want before making decisions on a real 200k-line codebase: it surfaces ideas I wouldn't have considered, explicitly warns me away from attractive traps, and gives me grep commands and AST analysis approaches I could run tomorrow. The trap detection alone would save weeks of pursuing dead ends. |

### naming-feature-flag — ✓ ADHD
_naming · A/B order swapped: false_

> Generate names for a feature-flag service that supports gradual rollout, kill-switches, and per-tenant overrides. The name should signal control and reversibility.

**Verdict:** A is a rigorous design exploration with traps identified and implementation sketches; B is a surface-level brainstorm list with textbook answers and no technical depth.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 6 distinct conceptual domains (gaming, ant-colony emergence, mechanical valves, audit/compliance, hardware circuits) with multiple ideas per domain. B covers 5 categories but they're all variations on the same industrial/electrical control metaphor - circuit breakers, valves, switches, dimmers are structurally similar 'physical control' ideas rather than genuinely distinct angles. |
| novelty | 7 | 3 | A includes genuinely non-obvious ideas like PheromoneTrails (traffic-based flag decay), Killcord (emergency pull metaphor), and SpringLatch (auto-expiring flags). B's suggestions are almost entirely textbook answers - CircuitBreaker, Dimmer, Switchboard are the first things any engineer would brainstorm. Canary is literally the industry standard term. |
| trap_detection | 9 | 1 | A explicitly lists 18 traps with specific reasons why each fails (e.g., CircuitBreaker 'already taken by resilience pattern; name collision', Fuse & Antifuse 'ampersand problematic for shell/URLs', PheromoneTrails 'evaporation metaphor conflicts with explicit control'). B has only a single weak trap note ('Avoid generic names like FeatureService') with no analysis of why specific proposed names might fail. |
| actionability | 8 | 3 | A's Focus section provides detailed implementation sketches for top picks: Killcord has a specific endpoint design ('/cord/:featureId/pull'), Latch has a concrete data structure (LatchState type with three fields), TenantValve specifies schema design. B recommends Switchboard/Dimmer but provides no implementation path, no first step, no technical sketch - just high-level metaphor descriptions. |
| builder_usefulness | 8 | 4 | A gives an engineer concrete starting points: specific APIs, data structures, precedence rules to solve, and explicit load-bearing risks to design around. The branching variations (PressureValve, ValveCascade) show how the core idea extends. B is a brainstorm list with marketing-style bullet points that would help in a naming meeting but not in actual system design. An engineer starting with A has a blueprint; with B they still need to do all the design work. |

---

_Methodology: each problem run through ADHD (5 frames × 6 ideas, top-3 deepened) and a single-shot baseline using the same model. A/B order randomized per problem to balance positional bias. Judged by a separate LLM call with a skeptical-staff-engineer system prompt._

_Full transcripts: see `bench/results.json`._