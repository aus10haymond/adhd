# ADHD vs baseline — evals

Run: 2026-05-25T11:28:55.772Z · problems: 6

**Headline:** ADHD 5W / 1L / 0T vs single-shot baseline.

## Aggregate scores (mean across problems, 0–10)

| Dimension | ADHD | Baseline | Δ |
| --- | ---: | ---: | ---: |
| breadth | 9.00 | 4.83 | +4.17 |
| novelty | 7.83 | 2.67 | +5.17 |
| trap_detection | 9.50 | 1.83 | +7.67 |
| actionability | 9.50 | 6.50 | +3.00 |
| builder_usefulness | 7.67 | 6.83 | +0.83 |

## Per-problem verdicts

### lru-100ms — ✓ ADHD
_systems · A/B order swapped: true_

> Design a thread-safe LRU cache that survives process restart without losing more than the last 100ms of writes.

**Verdict:** A is a polished, correct staff-eng doc with textbook solutions; B is a chaotic but superior idea space exploration with high novelty, explicit trap warnings, and deeper branches.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 4 | A explores 4 main approaches (WAL, snapshot+delta, mmap, dual-mode) plus 3 concurrency patterns—all are variations on 'persist writes to disk somehow'. B generates 7 structurally distinct categories (periodic flush, external DB, biological metaphors, distributed recovery, gamification, observability, exotic hardware) spanning 40+ ideas, many wildly different from each other. |
| novelty | 7 | 3 | A presents textbook solutions: WAL is the obvious answer, mmap and snapshots are standard. The recommendation (WAL + async logging + lock striping) is solid but exactly what a distributed systems course would teach. B includes obvious ideas (SQLite WAL, Redis) but also non-obvious-yet-viable ones: T-cell checkpointing (immune system batching), mitochondrial dual-genome (tiered storage with selective transfer), Merkle-tree checkpointing for tamper-proofing, neural codec compression for log size, inotify-triggered flushes. Several are weird but buildable. |
| trap_detection | 10 | 2 | A mentions 'mmap reliability varies' and 'fsync might exceed 100ms on slow disks' in passing but doesn't call out traps explicitly. B dedicates an entire section to 18 traps with specific reasons: shelve isn't thread-safe, pickle is O(n) per checkpoint, Redis violates scope, distributed plays are overkill for single-process, gamification ideas break LRU semantics, GPU VRAM has no thread primitives. Each trap explains *why* it fails, not just that it does. |
| actionability | 9 | 8 | A's recommendation has a clear sketch (sharded HashMap, async WAL sender, logger thread with 50ms recv_timeout), names risks (WAL growth, fsync variability, 1000 ops lost), and gives a first step (add monitoring). Missing: concrete test command or file structure. B's deepened branches give three fleshed-out paths with load-bearing risks explicitly named ('fsync lies under IO storms', 'ring buffer overflow forces blocking') and concrete first steps ('implement lock-free MPSC ring buffer in C, kill process 10k times'). Slightly more specific. |
| builder_usefulness | 8 | 7 | If I have to ship tomorrow, A is clearer: pick approach 1+4, use these libraries, done. It's a good staff eng doc. But B's trap section saves me from 18 dead ends I'd otherwise waste days on (I didn't know shelve wasn't thread-safe, would've tried Redis first). The 'branches off' subsections in B unlock future optimization paths (Merkle audit, two-temperature eviction, Kafka outsourcing) that A mentions vaguely ('add monitoring', 'use snapshots'). B is harder to parse but has more decision-critical info. |

### llm-hang-cli — ✗ baseline
_ux/reliability · A/B order swapped: true_

> We have a CLI that calls an LLM and the LLM sometimes hangs for 90 seconds before responding. Design the right retry/timeout/UX strategy.

**Verdict:** B explores vastly more creative territory and expertly identifies traps, but A delivers a pragmatic, immediately implementable solution that an engineer can ship today.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 6 | A explores 4 approaches (progressive timeout, fast-fail retry, hedged requests, streaming) that are architecturally distinct but all live in 'standard distributed systems patterns' space. B explores 9 structurally different categories (economic incentives, async control surfaces, gamification, perceptual distortion, collective intelligence, redundancy races) spanning payment systems, process forking, UI psychology, and emergent behavior—vastly wider solution space. |
| novelty | 8 | 3 | A presents textbook solutions: progressive timeouts, exponential backoff, hedged requests, and streaming are all well-documented patterns from Google SRE and distributed systems literature. The hybrid recommendation is sensible but predictable. B includes many non-obvious ideas: reverse token streaming, rage-quit buttons with visual heating, scout processes writing to shared queues, Unix socket daemons with ticket IDs, and economic plays like patience tokens. Most are impractical, but several (scout forking, daemon queuing, abort-to-fast-model) are genuinely novel in this context. |
| trap_detection | 10 | 2 | A mentions tradeoffs within each approach ('burns through retries quickly', 'doubles API usage') but doesn't explicitly call out ideas that look good but fail. B dedicates an entire section to traps with 20 specific examples and clear reasoning: 'introduces billing infrastructure for a technical retry problem', 'reverse token order makes output unreadable', 'scrollback replacement is jarring'. This is exactly what trap detection should look like—naming the attractors and explaining why they're dead ends. |
| actionability | 9 | 8 | A's hybrid recommendation includes a TypeScript sketch with concrete timeouts (15s first token, 30s between tokens, 90s absolute), progressive UI messages, retry logic, and observability hooks. Named risk is implicit ('user feels abandoned'). B's top pick (rage-quit button) includes: UI spec (blue→orange→red pulsing button after 15s), abort behavior (cancel + resubmit to Haiku), named risks ('users spam abort and rack up wasted compute', 'fast model gives terrible answers'), heuristic (>3 aborts auto-routes future prompts), and first concrete step ('instrument CLI to detect >15s, render button via blessed/ink, wire Ctrl+A to SIGINT then POST'). B edges ahead on explicit risk naming and first-step clarity. |
| builder_usefulness | 4 | 9 | If I have to ship tomorrow, A gives me a production-ready strategy I can implement with confidence: streaming + progressive feedback + smart retry + circuit breaker + observability. The code sketch maps directly to real libraries (AbortController, standard timeouts). B's top pick (rage-quit button) is creative but introduces UX complexity (terminal UI rendering, model routing logic, abort history heuristics) without solving the core reliability problem—most hangs aren't user-triggered impatience, they're provider-side issues that need automatic mitigation. The daemon approach is interesting but massive scope. A is immediately shippable; B requires weeks of R&D to validate. |

### rate-limit-leader — ✓ ADHD
_distsys · A/B order swapped: true_

> Design a rate limiter that stays correct across a leader election. Existing leader had counters in memory; new leader takes over with no warning.

**Verdict:** A is a solid staff-level design doc for known solutions; B is a research-level exploration that questions assumptions, names traps, and provides adaptation branches.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 5 | A explores 5 conceptual approaches (persistent store, conservative reset, optimistic allowance, periodic sync, distributed CRDT) that mostly vary in sync frequency/pessimism level—structurally similar 'where to put the counter' plays. B explores 6 architecturally distinct families: hardware shared-memory, client-side enforcement, log replay, temporary incorrectness, cryptographic protocols, plus hybrids. Within each family B lists 4-6 mechanically different implementations (NVRAM vs FPGA vs PCIe BAR vs DMA vs cache-line partitioning are all different substrate choices). A's five approaches collapse into two real decisions: sync or don't sync, pessimistic or optimistic. B's families span hardware, protocol design, cryptography, probabilistic data structures, and economic incentives—genuinely orthogonal design dimensions. |
| novelty | 8 | 3 | A presents textbook distributed systems answers: Redis counters, quota reset, token bucket with checkpointing, CRDTs—all correct but exactly what you'd find in a rate-limiting survey paper or Stripe's engineering blog. The 'hybrid' recommendation combines two standard techniques. B leads with proof-of-work rate limiting (turning computation into the rate limit itself, zero state), counter deltas embedded in election protocol metadata (abusing Raft's term field as a Bloom filter), hardware counters as stateless observers of monotonic time, client-side cryptographic token spending. These aren't standard playbook moves. Even B's 'obvious' ideas like NVRAM are taken to non-obvious extremes (memory-mapped PCIe BAR, DMA transactions as the consistency mechanism). A optimizes known solutions; B questions whether you need counters at all. |
| trap_detection | 9 | 2 | A lists cons for each approach but they're operational trade-offs ('extra latency,' 'temporarily stricter'), not traps—these are known costs, not seductive dead-ends. A doesn't warn you away from anything; every option is presented as viable depending on context. B has an entire 18-item 'Traps' section that names specific failure modes: NVRAM still has consistency windows, FPGA is cost-prohibitive, DNS propagation defeats real-time limiting, dying leader might not broadcast, Bloom filters create false positives that reject valid traffic, observer nodes don't solve the problem they just move it. Each trap explanation identifies why the idea fails under adversarial or failure conditions, not just that it's expensive. B explicitly calls out ideas that 'look good, aren't' and explains the load-bearing assumption that breaks. |
| actionability | 10 | 7 | A's top recommendation has a clear config sketch (checkpoint_interval: 3s, safety_margin formula) and pseudocode showing exactly how the new leader calculates tokens from checkpoint + elapsed time + safety buffer. It names the trade-off (3 second staleness) and gives you enough to start coding. B's top pick (proof-of-work) includes: the exact mechanism (hash with request + time window, count leading zeros), the risk (ASICs precompute nonces), the formula mapping difficulty to rate (100 req/min → 0.6s compute per nonce), and the first concrete step: 'write a benchmark measuring time to find k-zero nonce on client hardware, build lookup table of req/s to difficulty bits.' B also specifies SHA-256, mentions retune strategy, and gives you the validation algorithm (server hashes once, checks bits). A is actionable; B is a PR spec. |
| builder_usefulness | 9 | 6 | If I have to ship tomorrow and my manager already decided we're using Redis, A is a competent guide to standard practice—I'll implement #4, sleep fine, and it'll work. But if I'm in the design phase or the constraints are unusual (can't add Redis, failover must be <100ms, clients are adversarial), A doesn't help me think differently. B is more useful as a design artifact: the trap list saves me from 18 dead-ends I might've prototyped, the branches off each deep-dive show me how to adapt ideas when the first version hits reality (ASICs break PoW → add difficulty auto-tuning; clock drift breaks hardware counters → add PTP sync). The 'wide set' gives me language to explain trade-offs to stakeholders (we're doing client-side enforcement, not hardware plays, because we're in the cloud). A is a decision; B is a decision tree with labeled failure modes. |

### fuzzy-bug — ✓ ADHD
_debugging · A/B order swapped: true_

> 0.1% of API requests time out intermittently. No stack trace, no obvious pattern, no recent deploy. How should we investigate? Generate hypothesis classes, not specific fixes.

**Verdict:** B wins on breadth, novelty, and trap-detection; both are actionable but B provides more creative debugging angles and explicitly names failure modes.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 6 | A offers 6 hypothesis classes (resource exhaustion, external deps, request characteristics, concurrency, infrastructure, time-based) that are mostly standard debugging categories with subcategories. B provides 7 structurally distinct lens families (accelerated-reproduction, execution-archaeology, game-mechanics, invert-question, biological-system, market-dynamics) that are genuinely different conceptual approaches, not just domain partitions. |
| novelty | 8 | 3 | A lists textbook performance debugging hypotheses—connection pools, GC pauses, N+1 queries, lock contention are the first things any senior engineer checks. The investigation strategy (tracing, correlation analysis) is standard SRE practice. B proposes high-novelty plays like 'treat 0.1% as expressing legacy genes via deprecated code paths,' 'metabolic pathway starvation for trace nutrients,' and 'combo-chain priming from previous requests'—these are non-obvious but technically grounded. |
| trap_detection | 9 | 1 | A identifies zero traps. It presents all hypotheses and methods as viable without critique. B explicitly calls out 10 traps with specific reasons: synthetic timeout injection 'reproduces symptom not cause,' 1ms canary 'creates false positives that overwhelm signal,' disk writes in every function 'obliterate performance and mask the bug.' This is exactly what trap detection should look like. |
| actionability | 10 | 7 | A's top recommendation is actionable: 'distributed tracing for timeout requests with export rule at 90% threshold' plus 'connection pool metrics.' It names the likely culprit (infrastructure-level, not app code) and gives a starting point. B's top pick is highly detailed: instrument resource acquisition with specific fields (request_id, wait_time_ms, pool_utilization_pct), explains the risk (external bottlenecks invisible to app layer), and provides a precise first step (wrap acquire/release with hrtime, log >10ms to separate stream, correlate timestamps). B is more concrete. |
| builder_usefulness | 8 | 7 | If I'm shipping, A gives me a solid checklist of standard suspects and a reasonable starting point—I can execute this today with known tools. B forces me to think differently, which could unlock the problem if standard approaches fail, and the 'Focus' section provides enough detail to actually implement the top 3 hypotheses. B's trap section saves me from wasting time on 10 plausible-but-broken ideas. A is safer and faster to start; B has higher ceiling if the problem is non-standard. Close call, slight edge to B for preventing dead ends. |

### monolith-split — ✓ ADHD
_refactor · A/B order swapped: false_

> We have a 200k-line Rails monolith. The team wants to split it. Generate strategies for how to decompose it — by domain, data, team, churn, or otherwise.

**Verdict:** A wins on breadth, novelty, trap detection, and actionability with executable scripts and non-obvious techniques; B is competent but textbook.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 4 | A explores ~40 structurally distinct ideas across 6 categories (replace-foundation, measure-then-cut, biological-lifecycle, wait-for-pain-signal, etc.), including exotic angles like antigen tagging, mitochondrial extraction, and apoptosis boundaries. B covers 6 standard strategies (DDD, Strangler Fig, data ownership, Conway's Law, churn, hybrid) that are variations on well-known themes. A's breadth is substantially wider. |
| novelty | 8 | 2 | A includes multiple non-obvious-but-viable ideas: antigen tagging (runtime trace clustering), symbiotic extraction (mitochondria metaphor for third-party wrappers), queue-depth-triggered splits, and adversarial validation with injected latency. B presents textbook answers—DDD, Strangler Fig, Conway's Law are the standard playbook. A's novelty score is high despite some unviable extremes; B is almost entirely obvious. |
| trap_detection | 10 | 3 | A explicitly calls out 20 traps with specific reasons why they fail (e.g., 'Bash CGI is performance/security suicide', 'LLM-generated 500-service architecture is science fiction', 'Git submodules are operationally painful'). B has a 'Red Flags' section with 4 generic warnings but doesn't deeply analyze why attractive-sounding ideas are traps. A's trap analysis is exhaustive and mechanistic. |
| actionability | 9 | 6 | A's top pick (antigen tagging) includes: the exact logging code to add, the data structure (bipartite graph), the algorithm (Louvain clustering), the named risk (false coupling from analytics), and a concrete first step (add before_action hook to ApplicationController). B's recommendation is a meta-strategy ('start DDD, use Strangler Fig') with a 5-step roadmap, but step 1 ('Event Storming workshop') is a 1-2 week meeting, not a concrete action an engineer can take today. A is more immediately actionable. |
| builder_usefulness | 8 | 7 | If I'm the engineer shipping this, A gives me 3-4 immediately executable ideas (git churn script, antigen tagging, symbiotic extraction with bundle viz command) plus detailed branches showing how to de-risk each. B gives me a coherent mental model and avoids obvious mistakes, which is valuable for planning, but lacks the executable specificity to start tomorrow. A is more useful for doing; B is more useful for explaining to stakeholders. A wins narrowly because the question is about the builder who has to ship. |

### naming-feature-flag — ✓ ADHD
_naming · A/B order swapped: false_

> Generate names for a feature-flag service that supports gradual rollout, kill-switches, and per-tenant overrides. The name should signal control and reversibility.

**Verdict:** A delivers wide exploration, non-obvious ideas, extensive trap analysis, and implementation-ready detail; B offers polished but shallow textbook options with minimal rigor.

| dim | ADHD | base | reason |
| --- | ---: | ---: | --- |
| breadth | 9 | 4 | A explores 8 structurally distinct conceptual spaces (audit, undo, isolation, emergency-stop, circuit-protection, hardware-orchestration, gradual-control) with 30+ names. B offers 4 theme clusters that largely overlap (control/precision and reversibility/safety are semantically adjacent; gate/door vs toggle/switch are minor variations of access-control metaphors). A's hardware-orchestration and immunology angles are genuinely orthogonal to its emergency-stop plays; B's themes are facets of the same core idea. |
| novelty | 8 | 2 | A surfaces non-obvious candidates like Unmake (inversion of deployment semantics), Thymus Gate (immunology), Clock Gating Controller (hardware power management), and Autophagy Lever (cellular self-regulation)—these are weird but defensible. B lists textbook SaaS naming: Helm, Valve, Throttle are standard industrial metaphors; Flipper explicitly noted as used by LaunchDarkly. The only mildly novel entry is Portcullis, but medieval gate metaphors are well-trodden in access-control naming. |
| trap_detection | 9 | 1 | A explicitly flags 21 trap ideas with specific reasons (e.g., 'Chaos Lever implies randomness not controlled rollout,' 'Ratchet implies one-way progression, conflicts with reversibility'). This demonstrates adversarial thinking about why superficially appealing names fail on requirements. B offers one sentence: 'Avoid: Generic names... Overly cute names... might limit enterprise adoption'—vague warnings without dissecting why specific candidates fail or what makes them seductive traps. |
| actionability | 10 | 3 | A's top pick (Dimmer) includes: (1) API sketch with concrete method signatures (dimmer.setLevel, dimmer.override, dimmer.killSwitch), (2) named load-bearing risk ('lighting metaphor may feel too cute for enterprise buyers'), (3) first implementation step specifying class name, method signature, validation logic, and audit requirements. B recommends Helm/Valve with reasoning but no implementation sketch, no named technical risk (only market-positioning concern), and no concrete first step beyond vague API naming examples. |
| builder_usefulness | 9 | 5 | A gives an engineer ammunition: the Focus section provides implementation sketches, hybrid variations (Dimmer+Witness, UnmakeLedger), and unlocks (DimmerTrace for SOC2 compliance, TimeTravelUnmake for Git-like semantics). The trap list saves time by pre-empting dead ends. B provides clean rationale for two finalists and saves bike-shedding time with a clear recommendation, but lacks depth for someone who needs to defend the choice in design review or extend the concept. A's 'branches off' sections are directly usable for roadmap planning. |

---

_Methodology: each problem run through ADHD (5 frames × 6 ideas, top-3 deepened) and a single-shot baseline using the same model. A/B order randomized per problem to balance positional bias. Judged by a separate LLM call with a skeptical-staff-engineer system prompt._

_Full transcripts: see `bench/results.json`._