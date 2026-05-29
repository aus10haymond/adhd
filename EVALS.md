# ADHD vs baseline — evals

Run: 2026-05-29T21:36:05.405Z · problems: 17

**Headline:** ADHD 9W / 7L / 1T vs single-shot baseline (pairwise overall).

## Pairwise wins by dimension

Per-dimension A/B preference (no absolute scores — see task 0.5). Each cell
counts how often ADHD was preferred / baseline preferred / tie, across 17 problems.

| Dimension | ADHD W | base W | tie |
| --- | ---: | ---: | ---: |
| breadth | 17 | 0 | 0 |
| novelty | 16 | 1 | 0 |
| trap_detection | 17 | 0 | 0 |
| actionability | 8 | 9 | 0 |
| builder_usefulness | 3 | 14 | 0 |

## Output length (task 0.3 instrumentation)

Length of the artifact the judge actually reads, per problem. The ratio
exposes verbosity asymmetry — if ADHD wins are concentrated where its ratio
is highest, the win may be length-driven (see task 0.4).

| Problem | ADHD tok | Base tok | ADHD:Base | Winner |
| --- | ---: | ---: | ---: | :---: |
| lru-100ms | 4723 | 992 | 4.76× | base |
| llm-hang-cli | 2756 | 874 | 3.15× | base |
| rate-limit-leader | 4869 | 1012 | 4.81× | ADHD |
| event-ordering | 5104 | 1093 | 4.67× | tie |
| auth-model | 5138 | 1117 | 4.60× | base |
| sdk-pagination | 5563 | 865 | 6.43× | ADHD |
| cli-config-precedence | 2631 | 993 | 2.65× | base |
| fuzzy-bug | 4908 | 1041 | 4.71× | ADHD |
| memory-creep | 5538 | 929 | 5.96× | ADHD |
| monolith-split | 3314 | 1087 | 3.05× | base |
| orm-to-sql | 6087 | 1332 | 4.57× | ADHD |
| naming-feature-flag | 2655 | 473 | 5.61× | ADHD |
| naming-async-queue | 2239 | 463 | 4.84× | ADHD |
| review-payment-handler | 5443 | 1066 | 5.11× | ADHD |
| pricing-devtool | 3706 | 2587 | 1.43× | base |
| positioning-launch | 3573 | 1190 | 3.00× | base |
| agent-tool-choice | 4951 | 805 | 6.15× | ADHD |
| **mean** | **4305.76** | **1054.06** | **4.08×** | |

_estTokens = chars/4 (estimate); exact chars + words per output are in `bench/results.json`._

## Win rate by length bucket (task 0.4)

Problems grouped by ADHD:baseline length ratio. If ADHD's wins cluster in
the high-ratio buckets, the headline may be verbosity-driven, not substance.

| Length ratio | n | ADHD W | L | T | ADHD win rate |
| --- | ---: | ---: | ---: | ---: | ---: |
| ≤ 2× (similar length) | 1 | 0 | 1 | 0 | 0% |
| 2×–4× | 4 | 0 | 4 | 0 | 0% |
| > 4× (much longer) | 12 | 9 | 2 | 1 | 75% |

_With a small problem set these buckets are thin; the signal sharpens as the_
_problem count grows (task 0.7)._

## Cost & latency (task 0.8)

Summed across 17 problem(s); the multiplier is ADHD relative to baseline.
Judge calls are eval overhead and are not counted here.

| Metric | ADHD | Baseline | ADHD/base |
| --- | ---: | ---: | ---: |
| total cost (USD) | $8.1215 | $1.1342 | 7.2× |
| input tokens | 506 | 51 | 9.9× |
| output tokens | 131274 | 18136 | 7.2× |
| mean latency (s) | 53.2 | 15.7 | 3.4× |

_Per-problem usage + wall-clock are in `bench/results.json`._

## Idea duplication (task 0.9)

Near-duplicate rate among ADHD's raw divergence ideas (lexical token-Jaccard
≥ 0.5, transitively clustered). Baseline produces prose, not discrete ideas, so
this applies to ADHD only. Pre-Phase-2 baseline; the dedup pass must lower it.

- mean duplication rate: **1.9%**
- ideas across all runs: 474; near-duplicates: 9

_Lexical proxy — catches near-identical phrasing, misses paraphrase. Per-problem_
_counts in `bench/results.json`._

## Per-problem verdicts

### lru-100ms — ✗ baseline
_architecture · A/B order swapped: false_

> Design a thread-safe LRU cache that survives process restart without losing more than the last 100ms of writes.

**Verdict:** A is deeper exploration with trap awareness; B is narrower but actionable and ship-ready with clear tradeoffs.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A explores 6+ orthogonal strategy families (time-windowing, financial metaphors, external delegation, infrastructure, gamification, dual-representation) plus hybrid tiers. B covers 4 approaches (WAL, snapshots, dual-buffer, hybrid) that are all variations of write-ahead persistence. A's breadth is substantially wider despite many ideas being traps. |
| novelty | ADHD | A includes genuinely non-obvious ideas: circular buffer in POSIX shared memory with CRC, memory-mapped file with volatile bitmap index forcing rebuild, dual-buffer with epoch-based consistency, witness thread pattern for external validation. B's WAL and snapshot ideas are textbook cache durability techniques taught in systems courses; the hybrid combines them predictably. |
| trap_detection | ADHD | A explicitly labels 24 traps with precise failure modes (e.g., 'S3 round-trip latency (50-500ms) defeats the 100ms durability window', 'collateral liquidation doesn't prevent data loss'). B has no trap section; it presents all 4 approaches positively without naming failure modes or why some ideas should be rejected. |
| actionability | base | B's hybrid recommendation names specific steps: log format, O_APPEND mode, checksums, thread-safe queue, test strategy. A's top picks (circular buffer, WAL, mmap) describe the idea well but first steps are more vague ('implement minimal writer', 'implement ring-buffer WAL'). B is more immediately executable. |
| builder_usefulness | base | A's exploration is intellectually thorough but leaves a builder overwhelmed—24 named traps and 3-5 viable options per idea require significant judgment to converge. B cuts to 4 concrete approaches with clear tradeoff tables, picks a recommendation (hybrid), and lists implementation details you'd actually need (log format, O_APPEND, checksums). For shipping, B's structure is more useful despite less breadth. |

### llm-hang-cli — ✗ baseline
_architecture · A/B order swapped: true_

> We have a CLI that calls an LLM and the LLM sometimes hangs for 90 seconds before responding. Design the right retry/timeout/UX strategy.

**Verdict:** A delivers a concrete, implementable hybrid strategy with clear UX flows; B explores broad design space but buries actionable insights under 24 mostly-unviable ideas and lacks the specificity needed to actually build.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | B explores 8 structurally distinct categories (dynamic-timeout, distribute-and-batch, financialize, race-to-win, predict-and-sidestep, accept-and-embrace, streaming, async-daemon). A covers 3 approaches (aggressive timeout, long timeout with feedback, hybrid). B's breadth is significantly wider, though many branches are unviable. |
| novelty | base | A's hybrid approach (tiered timeout with user prompt at 15s, then extend to 120s) is non-obvious and practical. B generates many novel ideas (spot markets, insurance pools, semantic caching, retry auctions) but most are absurdly overengineered for the problem. A trades breadth for ideas that are actually viable in a CLI context. |
| trap_detection | ADHD | B explicitly names 24 trap ideas with reasoning for why they're bad (infrastructure burden, user-hostile monetization, overengineering, false economy). A mentions no traps—it doesn't acknowledge why approaches 1 and 2 might fail or mislead. B's trap section is the strongest part of its analysis. |
| actionability | base | A's Approach 3 includes a concrete state machine diagram, implementation flow, specific timing numbers (15s initial, 120s extended, one retry), and clear decision points (show user prompt at timeout). A also lists 3 follow-up actions (logging frequency, configurable flags, pattern caching). B identifies 'abort and fallback with cheap heuristic' as actionable but doesn't sketch it—just names it as a provocation. |
| builder_usefulness | base | A directly answers what to implement and when: start with 15s timeout + spinner, ask user at boundary, extend to 120s, retry once. A builder can start coding immediately. B exhausts the reader with 24 options (most infeasible) and barely sketches the one potentially useful idea (abort+fallback). A is 10x more useful for someone shipping today. |

### rate-limit-leader — ✓ ADHD
_architecture · A/B order swapped: true_

> Design a rate limiter that stays correct across a leader election. Existing leader had counters in memory; new leader takes over with no warning.

**Verdict:** A is the safer, more actionable production recommendation; B is the richer exploration that teaches you what *not* to do and exposes non-obvious alternatives worth considering for next-generation systems.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A covers ~4 distinct approaches (stateless, pessimistic reset, hybrid, token bucket). B systematically explores 9+ orthogonal categories (cryptographic-proof, audit-trail, persistent-storage, reset-on-transition, distributed-state, shift-burden-to-client, etc.) with multiple concrete instances each. B's breadth is substantially wider and more structurally diverse. |
| novelty | ADHD | A presents standard distributed systems patterns (external storage, token buckets, checkpointing)—all textbook solutions. B includes genuinely non-obvious ideas: gut flora quorum voting, cryptographic self-validating tokens, client-enforced rate limiting, Merkle tree validation, side tokens earned during normal operation. Most of B's shortlist picks are ideas practitioners wouldn't immediately reach for. |
| trap_detection | ADHD | A has no trap detection at all. B explicitly names 20+ seductive-but-broken ideas with precise failure modes: proof-of-work doesn't validate timing, grace periods create exploitation windows, clock rewind breaks consistency, client-side state gets forged, etc. Each trap includes a concrete reason why it fails, which is educational and prevents expensive mistakes. |
| actionability | base | A's top recommendation (stateless with Redis) is immediately actionable: use external storage, atomic operations, no state loss by design. B's top picks are more elaborate: gut flora quorum requires implementing RPC interfaces and majority voting; distributed lymph node requires versioned snapshots and dual-write logic. A gets you shipping faster. B's 'Focus' section does attempt concrete steps (e.g., 'instrument old leader to detect loss'), but A's simplicity is operationally cleaner. |
| builder_usefulness | base | If shipping tomorrow, A's recommendation (stateless + Redis) is battle-tested, low-risk, and requires minimal code. B offers richer ideas for long-term robustness (quorum voting, tokens, cryptographic validation) but adds complexity that requires careful implementation. For most teams, A's straightforward approach prevents bugs better than B's sophisticated but harder-to-execute options. A also acknowledges the #4 alternative (token bucket + durable refill), which is a reasonable escape hatch if external storage isn't viable. |

### event-ordering — = tie
_architecture · A/B order swapped: false_

> A third-party webhook may deliver events out of order, duplicated, and retried for hours. Design how to process them so downstream state is correct and idempotent.

**Verdict:** A excels at breadth, novelty, and trap detection; B excels at actionability and builder usefulness—different strengths for different phases (design vs. execution).

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A presents ~15 structurally distinct approaches (event-log inversion, entity-scoped ledgers, sequence numbering, time-windowed batching, hub-and-spoke, circuit breakers, event sourcing variants, etc.). B presents 4 approaches, with Approach 3 (event sourcing) being a shallow restatement of concepts A develops in detail. A's breadth is substantially wider. |
| novelty | ADHD | A foregrounds non-obvious ideas: entity-scoped last-mile ledgers with idempotency key caching, 'sort yard' buffering for out-of-order events, inverting the webhook model to make consumers tail logs instead, ledger-TTL expiry trades, persistent sort-yard replay across restarts. B's novelty is low—deduplication + ordering queue and idempotent handlers are textbook patterns. Event sourcing (Approach 3) is presented generically without the innovative ledger-inversion angle A emphasizes. |
| trap_detection | ADHD | A explicitly names 13 anti-patterns with concrete failure modes: wall-clock time overwriting newer state, storing only latest event causing rollback from old duplicates, distributed locks causing deadlock, in-memory dedup windows voiding on worker restart, millisecond granularity hash collisions, hub bottlenecks, merkle trees adding overhead without solving ordering, Byzantine fault tolerance overkill, probabilistic reconciliation missing divergences, shadow simulation exploding compute. B has no trap detection section—it lists tradeoffs for its 4 approaches but doesn't name pitfalls of approaches it doesn't recommend or common mistakes. |
| actionability | base | B's top recommendation (Approach 2 → Approach 1) includes a concrete handler code sketch in Python, specific Redis key naming, TTL guidance (24-48 hours), observability checklist, and a clear migration path ('start with idempotent handlers, add dedup when needed, move to queue if critical'). A's top recommendation includes named risks ('load-bearing risk is the ledger becoming a bottleneck'), first steps ('add a (entity_id, idempotency_key, result_json, applied_at) table, then wrap your webhook handler...'), but no code sketch or worked example. A prioritizes depth of exploration over step-by-step implementation guidance. |
| builder_usefulness | base | A builder shipping code needs a clear starting point and incremental path. B provides: (1) a recommended approach with concrete code, (2) a staged migration strategy (lightweight → heavy), (3) named infrastructure requirements (Redis set, database table, queue choice), (4) specific TTL values and key naming conventions, (5) handler pattern. A provides deep conceptual exploration and risk analysis but requires the builder to synthesize a coherent implementation strategy from ~15 branches. For execution-phase work, B is more immediately useful; for design-phase risk assessment, A is superior. |

### auth-model — ✗ baseline
_architecture · A/B order swapped: true_

> Design the authorization model for a multi-tenant SaaS where some resources are shared across tenants and some users belong to multiple tenants with different roles in each.

**Verdict:** A is a shipper's guide with one clear recommendation and implementation sketch; B is a research frontier exploring design space but flagging its own top picks as partially flawed.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | B covers ~15 structurally distinct approaches (schema isolation, caching strategies, shared resource models, dangerous anti-patterns, gamification mechanics, audit models, delegation patterns). A covers 3 main approaches (tenant-first grants, resource ACLs, role-based) plus implementation details. B's breadth is substantially wider. |
| novelty | ADHD | B includes genuinely non-obvious ideas: ownership with nullable owner_tenant_id, fog-of-war visibility gating as permission model, skill-tree visualization for permission cascades, two-phase routing + query authorization. A sticks to textbook patterns (tenant-first model, ACLs, RBAC). B's novelty is higher by ~3-4x. |
| trap_detection | ADHD | B explicitly names 12+ traps with sharp diagnosis: connection-time schema switching creates test/debug complexity, webhook invalidation causes race conditions, 1-hour audit delay breaks real-time collaboration, bitmask limits expressiveness, header-derived context allows impersonation, per-query access checks leak data. A mentions no traps at all. |
| actionability | base | A's top recommendation (tenant-first grants) includes: clear code example, explicit pros/cons list, implementation details (context object structure, middleware pattern, caching strategy, indexing hints, soft-delete considerations). B's top recommendation (ownership dual-tenant_id) includes a load-bearing risk, first concrete step (migration + audit), and 5 branches, but branches are sketches without code. A is more immediately implementable. |
| builder_usefulness | base | A gives you a decision tree: pick approach based on your collaboration intensity (low → role-based, medium → tenant-first, high → ACLs). You can start implementing today. B is intellectually richer but the top-pick branches are half-baked (bitmask caching has known cons; immutable audit with 1-hour delay is listed as a trap). For shipping, A's clarity and completeness win over B's breadth. |

### sdk-pagination — ✓ ADHD
_api-design · A/B order swapped: true_

> Design the public API surface for paginating a list endpoint in a client SDK used by both first-time users and power users running large backfills. Optimize for hard-to-misuse.

**Verdict:** B systematically explores structural tradeoffs and names traps A misses, but A provides a faster path to shipping; B is the better design document, A is the better sprint plan.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A presents 4 main approaches (cursor, page-based, iterator, hybrid) with limited structural variation. B systematically explores 6 conceptual branches (encode-state-invariants, server-driven-adaptive, semantic-snapshots, protect-against-stale, adapt-limits, make-misuse-detectable, make-pagination-state-visible, prevent-concurrent-hazards) representing genuinely different architectural philosophies—stateful vs stateless, server-driven vs client-driven, metadata-rich vs opaque, adaptive vs fixed. |
| novelty | ADHD | A rehashes standard pagination patterns (cursor, offset, iterator). B explores less-obvious angles: cursor auto-advance-on-read (pheromone evaporation metaphor), stateless pagination forcing explicit cursor threading, cursor format parameter hashing, bidirectional cursor tunneling, cursor degradation protocols, genealogy tracking. Most of these trade conventional ergonomics for misuse-prevention in non-obvious ways. |
| trap_detection | ADHD | A mentions tradeoffs but treats them as design choices, not traps. B has a dedicated 'Traps (look good, aren't)' section that explicitly identifies 21 superficially appealing but problematic ideas with specific failure modes: server-driven hints become stale, open streams break on connection drop, time-snapshots require point-in-time query support, bidirectional random-access breaks cursor consistency, adaptive sizing misinterprets transient errors, etc. This is gap-spotting work A doesn't do. |
| actionability | ADHD | A's recommendation is generic ('use cursor-based + iterator wrapper, validate limits, make cursor handling explicit'). B's 'Focus—deepened branches' section dives into 3 concrete approaches with load-bearing risks named and first steps sketched: (1) auto-advancing cursor in SDK object + atomicity + forbid serialization, (2) stateless return format requiring cursor threading + server mutation handling + cursor wire format with version hash, (3) parameter hash validation with CursorMismatchError type. Each includes variations and unlock scenarios. |
| builder_usefulness | base | If shipping in the next sprint, A gives a clear, implementable pattern: cursor-based API with opaque tokens, hasMore flag, validation on limit, plus optional iterator wrapper. It's pragmatic and immediately buildable. B is a design exploration tool—the trap section and variations are valuable for vetting ideas, but the 'Focus' section is still exploratory branching rather than a shipable spec. A sacrifices depth for directness; B sacrifices directness for architectural reasoning. |

### cli-config-precedence — ✗ baseline
_api-design · A/B order swapped: false_

> Design how a CLI should resolve configuration when it can come from flags, environment variables, a user config file, and a project-local file. Generate approaches for precedence, discoverability, and debuggability.

**Verdict:** A is broader and catches more traps; B delivers a clear recommendation with working implementation sketch—the builder trades novelty for usability and wins.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A explores 8 distinct conceptual frameworks (pitfalls, biological-inspired precedence, game mechanics, debuggability, optimizations) with dozens of sub-ideas. B covers 3 precedence options, discoverability, and debuggability—all standard approaches. A ranges across metaphor-driven designs, mechanism variations, and teaching models; B stays in conventional solution space. |
| novelty | ADHD | A proposes non-obvious ideas: synaptic weight precedence, evolutionary resampling, threshold-gated activation, config-as-deck-building, friction-as-tutorial, diff-as-URL debugging. B proposes standard industry patterns (strict priority, hierarchical merge, XDG paths, debug flags). A has genuine creative risk; B is safe textbook. |
| trap_detection | ADHD | A explicitly names 20+ ideas as traps and explains why each fails (non-determinism, obscured semantics, undebuggability, complexity creep). It distinguishes between genuinely bad ideas and viable-but-metaphorical ones. B mentions no traps at all—just presents options without naming which patterns break reproducibility or create support burdens. |
| actionability | base | B gives a clear top recommendation (Option 1: Strict Priority Order), explains when to evolve to Option 3, provides pseudocode, concrete file paths, example debug output format, and a decision framework tied to use cases. A's converge section critiques ideas but doesn't crystallize into a 'start here' recommendation with implementation sketch. |
| builder_usefulness | base | If shipping tomorrow, B gives you: exact precedence order to code, file search paths (project-local walking to .git, user at ~/.config), environment variable prefix convention, three debug commands to implement, and pseudocode. A gives you creative framings and trap catalog but no implementation roadmap. B is immediately useful; A is intellectually rich but requires translation to code. |

### fuzzy-bug — ✓ ADHD
_debugging · A/B order swapped: true_

> 0.1% of API requests time out intermittently. No stack trace, no obvious pattern, no recent deploy. How should we investigate? Generate hypothesis classes, not specific fixes.

**Verdict:** B trades some clarity for novelty and rigor—non-obvious experiments (asymmetric injection, timestamp forensics, GC correlation), explicit trap warnings, and concrete instrumentation steps beat A's clean-but-standard hypothesis taxonomy.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A covers 6 hypothesis classes (resource contention, downstream dependencies, client artifacts, concurrency, configuration, environmental). B covers 5+ major categories (bottlenecks, cascading failures, timing/infrastructure, request-shape sensitivity, state drift, traffic anomalies) plus measurement tactics. B's categories are more structurally distinct—e.g., 'cascading feedback loops' and 'asymmetric dependency latency' are orthogonal to each other in ways A's hypotheses overlap (resource contention and thread starvation both point to pool exhaustion). B also explicitly separates measurement/reproduction tactics as a distinct investigative dimension. |
| novelty | ADHD | A is mostly textbook—resource exhaustion, dependency latency, client patterns, locks, config drift, network noise are all standard troubleshooting. B includes non-obvious angles: the 'asymmetric latency injection' technique (inject delay into one service to isolate), the 'modulo timestamp analysis' to uncover hidden cron jobs, the 'timeout as measurement artifact' (canary with 10s timeout to test if timeout is real), and the 'request queueing layer decoupling' (measure queue depth separately from handler time). These move beyond standard checklists into targeted experimental strategies. |
| trap_detection | ADHD | A mentions tradeoffs but doesn't explicitly call out bad-looking hypotheses. B has a dedicated 'Traps' section naming 10+ ideas that sound plausible but fail—e.g., 'DNS resolution failures are rare and usually manifest as connection refused, not timeout', 'circuit breaker metaphor obscures specifics', 'gut flora dysbiosis cannot be operationalized'. This disciplined labeling of seductive-but-useless theories is absent in A. |
| actionability | ADHD | A's 'Recommended Investigation Order' is a phased roadmap (start with logging, then profiling) but light on operational detail. B's top three picks each have named load-bearing risks, first concrete steps, and branching sub-investigations. For example: 'inject 500ms latency into each critical dependency on 1% of traffic, measuring whether timeout rate jumps from 0.1% to 5%', with explicit callout that artificial latency might trigger cascades that don't mirror real failures. B also gives exact commands ('grep all timeout events for exact second-of-minute patterns, compute histogram'). |
| builder_usefulness | ADHD | A is a good mental model but gives you a checklist; you still have to decide what to instrument and how to test. B gives you a sequence of high-signal experiments (asymmetric injection, timestamp modulo analysis, GC instrumentation) that isolate variables surgically. The 'deepened branches' section in B walks through exactly what instrumentation to add and what metric patterns to look for (e.g., 'if 80% of timeouts are slow on cache layer, you've isolated the hypothesis'). A team using B could start investigating immediately; A requires translating 'monitor resource utilization' into actual metrics. |

### memory-creep — ✓ ADHD
_debugging · A/B order swapped: false_

> A long-running service's memory grows slowly over days until it is OOM-killed about weekly. No single allocation site stands out in a heap dump. Generate hypothesis classes for where the growth could come from.

**Verdict:** A dominates in breadth, novelty, and trap-spotting but sacrifices shipping readiness; B sacrifices depth for a more directly implementable diagnostic roadmap.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A covers ~15 distinct hypothesis classes with structural variations (allocator behavior, micro-leaks, external resources, caches, listeners, instrumentation approaches, queue dynamics). B covers 6 classes, with significant overlap (e.g., classes 1 and 2 are both about collections/references). A's metaphor-heavy expansion, while partially noise, does explore orthogonal angles (GC pressure under load, clock skew in telemetry, constructor-level instrumentation). B is narrower and more textbook-standard. |
| novelty | ADHD | A proposes non-obvious ideas: constructor-counter diffing across restart boundaries (bypasses heap dump analysis entirely), cache autopsy via theoretical eviction simulation, telemetry buffer clock-skew scenarios, per-entry cohort tracking for age-based analysis, and the 'listener registry instrumentation' hybrid. B stays in standard territory: search for uncleaned collections, check weak references, monitor file descriptors—all textbook leak-hunting. A's novelty is higher, though some is wrapped in unnecessary metaphor. |
| trap_detection | ADHD | A explicitly marks 20+ ideas as traps with named reasons: OS fragmentation as rare (correct), tiny micro-leaks as hard to prove, periodic restart as symptom-hiding, pattern-based eviction as guesswork, manual grep as incomplete, mocking external services as unrealistic. B has no trap section and implicitly assumes all 6 hypotheses are equally viable; it lists external resource leaks as 'monitor separately' without warning that FD leaks are rare or that correlation is not causation. |
| actionability | ADHD | A's top pick (cache eviction bugs) includes: named risk (bug only triggers under production load/access patterns), a sketch (log eviction attempts and replay against traffic), and three concrete follow-ups (per-entry lifetime tracking, cache autopsy via theoretical eviction, per-entry cohort histogram). B's top pick (accumulating collections) says 'search for Map/Set without removals' and 'check size limits'—no named risk beyond the obvious, no sketch of what production evidence looks like, no priority-ordered next steps. |
| builder_usefulness | base | If shipping a diagnostic tool tomorrow, B's straightforward framework is more useful: 6 clear categories, standard investigation paths (heap snapshots hourly, instrument collection sizes, monitor external resources), and a decision tree ('if heaps are balanced, focus on 3/5/6'). A is intellectually richer but demands judgment calls: the cache eviction branches require understanding which cache implementation is buggy before instrumenting; the constructor counter idea requires choosing which 20 classes to instrument; trap detection requires engineers to know which hypotheses to deprioritize. B's narrower set and explicit metric suggestions (queue depths, GC frequency, pool configs) map more directly to code changes. |

### monolith-split — ✗ baseline
_refactor · A/B order swapped: false_

> We have a 200k-line Rails monolith. The team wants to split it. Generate strategies for how to decompose it — by domain, data, team, churn, or otherwise.

**Verdict:** A explores the decomposition idea-space more broadly and flags real traps, but B provides an actual playbook—audit → strangler fig → ordered extraction—that a team can execute Monday morning, whereas A leaves builders choosing between 25 unranked options.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A covers ~25 distinct structural angles across audit/safety, failure modes, team autonomy, data-centric, and parallel evolution. B covers 5 categories (domain, data, team, churn, hybrid). A deliberately explores non-obvious dimensions (pheromone-driven clustering, data gravity, memory-mapped async, cryptographic attestation) alongside conventional ones. B restates domain/data/team repeatedly as variations. |
| novelty | ADHD | A introduces genuinely non-obvious ideas: 'refusal layer' policy gates, change-log-first services, pheromone-driven self-organization, foraging cost metrics, parallel monolith hollowing, event-sourced event store as system of record, and cryptographic event attestation. B covers textbook approaches (domain-driven design, CQRS is mentioned late) that any Rails team already knows. A's weakest ideas are still more inventive than B's strongest. |
| trap_detection | ADHD | A names 24 ideas and explicitly flags which are traps, with specific reasons ('adds compliance overhead', 'becomes centralized bottleneck', 'creates artificial stratification', 'relies on unenforceable scent trails'). B names 5 red flags in a generic bullet list ('extracting too many at once', 'ignoring data migration costs') with no link between ideas and failure modes. A's trap analysis is dense and specific; B's is generic checklist advice. |
| actionability | base | B gives a concrete execution path: audit phase (2-4 weeks, specific steps: map dependencies, identify seams), strangler fig approach (extract one domain at a time), risk-ordered extraction (low-risk high-churn first, stable-critical last), and a clear first step (domain workshop to identify 4-6 services). A ends with a 'provocation' about cryptographic attestation—interesting but not a concrete next move. B provides a named, sequenced, resourced playbook; A provides exploration without closure. |
| builder_usefulness | base | A team actually shipping needs: (1) a decision framework (domain + churn + team + data ownership), (2) ordered risk (which service to extract first), (3) time budget (6-12 months), and (4) concrete first step (workshop). B delivers all four. A is a creative exploration of the idea-space—useful for *thinking* about tradeoffs but not for *planning* the extraction. A's cryptographic attestation, pheromone clustering, and parallel monolith ideas sound sophisticated but require pre-decisions A doesn't provide. B makes tradeoffs explicit so teams can choose; A makes all options equally tempting. |

### orm-to-sql — ✓ ADHD
_refactor · A/B order swapped: true_

> Plan migrating a large codebase off a heavy ORM toward hand-written SQL for hot paths, without a big-bang rewrite and without freezing feature work. Generate incremental strategies.

**Verdict:** B trades immediate usability for intellectual depth: broader angles, non-obvious ideas, explicit trap naming, and detailed risk-aware sub-branches, but less clear entry point than A's pragmatic four-strategy playbook.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | B spans ~25 structurally distinct angles (abstraction-layer switches, performance-data-driven, dual-path validation, biological metaphors, team incentives, unclustered approaches, consensus models). A covers ~4 main strategies (targeted query layer, query builder bridge, read/write separation, dual models). B's range is far wider, though includes padding. |
| novelty | ADHD | B introduces non-obvious ideas: shadow replay validation against production traffic, circuit breakers with auto-fallback, query-level achievement unlocks, rotating migration pods, pattern-based query tagging, replay-based equivalence proof. A sticks to textbook patterns (query layer abstraction, query builders, read/write splits) that are standard scaling playbooks. |
| trap_detection | ADHD | B explicitly names ~20 traps with clear reasons (feature flag sprawl, 48h SLA arbitrariness, replica cost overhead, gamification backfire, rotating teams dilute expertise, leaderboards incentivize speed over quality, quorum delays isolated bottlenecks). A names no traps; it assumes all four strategies are sound or mentions only vague disadvantages like 'slight duplication.' |
| actionability | ADHD | B's top three recommendations each include: named load-bearing risk, concrete first step, and branching sub-strategies. Example: 'Migrate P99 queries → instrument top 3 ORM queries, export plans to spreadsheet, have one oncall write proof-of-concept during low-interrupt week.' A's top recommendation (Strategy 1) lacks named failure modes and first-step detail beyond 'profile production.' |
| builder_usefulness | base | A is immediately useful: clear decision tree (4 strategies), explicit tradeoffs per strategy, practical example patterns, and a realistic phased timeline (Month 1-3). A builder can pick Strategy 1 and start Monday. B is intellectually rich but operationally scattered—the 'Provocation' section at the end (T-cell query validators) undermines confidence that the main recommendations are the ones to actually use. B's deepened branches are useful but buried under 20+ trap warnings. |

### naming-feature-flag — ✓ ADHD
_naming · A/B order swapped: false_

> Generate names for a feature-flag service that supports gradual rollout, kill-switches, and per-tenant overrides. The name should signal control and reversibility.

**Verdict:** A maps the design space systematically with novel outliers and implementable scaffolding per recommendation; B surveys safe defaults with surface-level risk analysis.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A organizes ~25 candidates across 6 distinct conceptual clusters (mechanical-control, temporal-reversal, boundary-management, gradual-degradation, chaos-volatility, emergency-stop). B offers ~12 names grouped into 3 loose categories (direct control, reversibility, control+tenant) with less structural separation. A's clustering reveals different semantic framings; B's grouping is mostly surface-level. |
| novelty | ADHD | A includes non-obvious candidates like Deadman's Switch (inverting morbidity into safety-first positioning), Rewind (treating rollout as temporal navigation rather than state), and Memory Fence Toggle (hardware metaphor stretched into feature flags). B sticks to conventional choices: Circuit/Valve/Governor are textbook infrastructure names. Flux and Tide are softer but still predictable. A has real outliers; B has none. |
| trap_detection | ADHD | A explicitly names 20+ weak candidates with specific failure reasons (Valve lacks distinctiveness, Circuit is overloaded, Chaos signals loss of control, Lockdown implies permanence, etc.). B mentions only surface-level 'risk' sections on 3 names without explaining why they fail conceptually. A's trap analysis is systematic and reasoning-forward; B's is generic. |
| actionability | ADHD | A's top picks (Escape Hatch, Deadman's Switch, Rewind) each include: (1) mental model explanation, (2) explicit load-bearing risk, (3) first concrete step (e.g., 'sketch operator dashboard with big red button', 'prototype heartbeat-based flag state'). B recommends Valve/Circuit but gives only vague tradeoffs ('intuitive', 'might confuse'). A is implementable; B is consultative. |
| builder_usefulness | ADHD | A gives you the conceptual scaffolding to build: Escape Hatch's dashboard design, Deadman's Switch's heartbeat model, Rewind's event log architecture. It also tells you which branches pair well (Rewind + Circuit for self-healing rollouts). B tells you to pick between Valve and Circuit based on audience, but doesn't give you the semantic model for the system itself. A helps you architect; B helps you present. |

### naming-async-queue — ✓ ADHD
_naming · A/B order swapped: false_

> Generate names for an internal async job-queue library whose selling points are durability and making retries/failures visible. The name should signal reliability without sounding boring.

**Verdict:** A delivers systematic, trap-aware exploration with named risks and concrete next steps; B offers polished but generic recommendations with no risk scaffolding or branching logic.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A systematically explores 7+ distinct semantic clusters (anchoring-stability, immutable-record, steady-witness, entropy-absence, failure-visibility, financial-settlement) and then deepens 3 specific branches (Witness, Unwaver, Echoes) with hybrid recombinations. B groups 12 names into 3 loose buckets (confidence, visibility, action) without structural variation—most are just synonyms within each bucket (Steadfast/Anvil/Bedrock/Ironclad all signal durability; Ledger/Chronicle/Manifest/Waypoint all signal tracking). A's clusters are semantically orthogonal; B's buckets overlap heavily. |
| novelty | ADHD | A surfaces genuinely non-obvious picks like Unwaver (a contraction playing on 'unwavering'), Echoes (permanent reverberations as a durability metaphor), and Scar (resilience via visible damage). B sticks to textbook answers: Anvil, Ledger, and Covenant are all predictable reliability metaphors you'd find in any naming brainstorm. 'Unwaver' and 'Echoes' are the only ideas here that aren't immediately obvious to someone thinking about job queues. |
| trap_detection | ADHD | A explicitly flags 20+ candidate names with named failure modes (e.g., Phantom = 'opposite of durability,' Ledger = 'overused in fintech,' Heartbeat = 'signals liveliness not durability'). B offers no trap analysis—it simply lists names with positive spins and recommends two without surfacing why the others fail. A's rigor prevents recommending names that sound good but misfire; B offers no guardrails. |
| actionability | ADHD | A pairs each top candidate (Witness, Unwaver, Echoes) with: (1) a named load-bearing risk, (2) a validation gate ('if core differentiator is visibility, it works; if not, pick something lighter'), and (3) a concrete first step (e.g., 'build a CLI tool with `witness replay job-123 --from-failure`'). B recommends Anvil/Ledger but offers no risk analysis, no conditional logic, and no next-step sketch—just 'it works well in documentation.' |
| builder_usefulness | ADHD | A's deepened branches (Witness + Quicksand, Unwaver + Breadcrumb, Echoes + Cascade) and hybrid recombinations give a builder material to test and iterate on—you can see how each name unlocks different product positioning (compliance narrative, debugging-first, workflow support). B's two recommendations are solid but lack this tactical depth; a builder would have to invent the next level of thinking themselves. A hands you the branching paths; B hands you two solid options and stops. |

### review-payment-handler — ✓ ADHD
_code-review · A/B order swapped: false_

> Widen a code review of a handler that deducts a user's account balance and then calls an external payment API. Beyond the obvious checklist, generate the classes of things that could go wrong here.

**Verdict:** A excels at breadth, novelty, and trap detection through systematic taxonomy + negative space analysis; B excels at practical implementability through clearer pattern prescription, but A's rigor is more useful for preventing undetected failure classes.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A spans 9 distinct structural classes (synchronization, immutability, error recovery, async buffering, etc.) with concrete variations per class. B covers ~8 failure categories but mostly orthogonal to each other, with less internal branching. A's taxonomy is more systematically organized—each class spawns multiple design variations, whereas B lists failure modes without exploring parallel solution architectures. |
| novelty | ADHD | A includes genuine non-textbook ideas: transactional outbox pattern, deduction hold state with auto-expiry, idempotency-key-based webhook reconciliation, shadow ledger for read-replicas. B sticks closer to standard financial system patterns (two-phase commit, reconciliation jobs, idempotency keys, circuit breakers)—all sound but well-known. A's 'reverse the order' inversion and 'pending state with grace period' are less obvious. |
| trap_detection | ADHD | A explicitly sections 'Traps (look good, aren't)' with 16 named trap ideas and concrete explanations of why each fails (e.g., 'voting on consistency doesn't resolve conflicts,' 'ML prediction doesn't prevent failure,' 'blockchain adds immutability theater'). B has no trap section; it only recommends positive approaches. A's trap analysis catches ideas that sound plausible but are actually cargo-cult thinking. |
| actionability | ADHD | A's 'Focus — deepened branches' section picks three concrete failure modes, sketches root causes, names the load-bearing risk, and prescribes first concrete steps (e.g., 'implement idempotent request IDs: before calling the payment API, generate a unique idempotency key, store it locally...'). B's 'Recommended Approach' section lists 7 items but is more generic checklist than diagnostic path. A walks through *why* the risk exists and *what* specific code change unlocks safety. |
| builder_usefulness | base | B is immediately implementable: it names concrete patterns (two-phase, idempotency keys, reconciliation job, NOT NULL constraints, signed webhooks) that a team can start coding tomorrow. A is richer in exploration but the deepened branches still leave gaps (how exactly do you implement the transactional outbox in your stack?). For shipping, B's structure is cleaner—checklist + patterns + mitigations map directly to code tasks. A is better for *design thinking* but B is better for *sprint planning*. |

### pricing-devtool — ✗ baseline
_strategy · A/B order swapped: true_

> Generate pricing-model strategies for a developer tool whose users range from solo hobbyists to large enterprises with procurement teams. Surface non-obvious models and their failure modes.

**Verdict:** A delivers a battle-tested, implementable pricing model with named risks; B exhaustively catalogs trap ideas and exotic concepts with no actionable path forward.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | B spans 8+ structurally distinct categories (emergent-signal, identity-role, version-roadmap, financial-derivatives, subsidy-exchange, dormancy-decay, clearing-house, granular-metering). A covers 10 models but most are textbook (usage-based, seat-based, freemium, value-based, feature-tiers, volume-discounts, time-based). B's categories are orthogonal (e.g., derivatives vs. gut-flora vs. roaming discount signals); A's are variations on the same axis (unit economics). |
| novelty | ADHD | B includes genuinely non-obvious ideas: emergent repricing via adoption velocity, competitor-sensing swarms, futures contracts on capacity, feature bidding spot markets, usage volatility swaps, pricing parasites (referral-locked premium), dormancy windows with reactivation fees. A's ideas (committed spend + overage, feature-based tiers, volume discounts) are standard SaaS playbook. B's 'neural plasticity pricing' and 'gut-flora model' are provocative even if flawed. |
| trap_detection | ADHD | B explicitly names ~25 trap ideas with failure-mode reasons (e.g., 'death spiral cascades,' 'price wars accelerate to zero,' 'false positives in team detection'). A names failure modes within each model (~2-3 per model) but doesn't separate viable from trap-tier. B's 'Traps (look good, aren't)' section isolates speculative/bad ideas with clear reasoning. A would never distinguish between an idea worth trying and one that's inherently unsalvageable. |
| actionability | base | A's recommendation is concrete: Free tier (100K API calls/month, no payment) → Pro (capped $500/month) → Enterprise ($2K-10K+ committed). Names specific guardrails ('don't let free tier be fully featured'). B ends with a provocation ('What if we took this seriously...') and no shipping recommendation. A is a playbook; B is a taxonomy of traps. |
| builder_usefulness | base | If you're shipping next quarter, A gives you a model to implement immediately: three tiers, clear limits, overage mechanics. B is a research artifact—useful for stress-testing your model or spotting edge cases, but requires translating every insight back to first principles. A also asks 'What's your current user mix?' signaling actual business context. B assumes deep pricing sophistication the reader may not have. |

### positioning-launch — ✗ baseline
_strategy · A/B order swapped: true_

> Generate positioning angles for launching an open-source observability tool into a crowded market dominated by well-funded incumbents. We need angles that are defensible, not just contrarian.

**Verdict:** A is a professional positioning strategy with clear recommendation and execution path; B is an exhaustive idea-generation artifact with trap-detection overhead but no narrowed strategy.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A covers 5 core angles (vertical-first, open-source moat, middle market, developer experience, cost transparency). B presents ~15 structurally distinct branches (cost-as-moat, operational-control, incident-velocity, adoption-inversion, engagement-compounding, financial-abstraction, zero-overhead-instrumentation). Even accounting for B's 'traps' section filtering ideas, B's initial ideation space is 3x wider. B's financial-abstraction branch alone (futures, clearing house, commodities, underwriting, order books) represents conceptual territory A doesn't touch. |
| novelty | ADHD | A's angles are professionally sound but textbook: vertical specialization, open-source moat, middle-market gap, DX focus, and transparent pricing are all recognized positioning patterns. B includes genuinely non-obvious ideas: observability futures markets, timing-channel anomaly detection, cache-miss instrumentation, embedded-first positioning, and observability-as-commodity-exchange. Most of B's ideas are impractical (as B itself flags), but they're not obvious retreads. A is the 'right' answer; B is the 'surprising' answer. |
| trap_detection | ADHD | A mentions trade-offs and risks informally ('requires serious engineering and patience,' 'TAM is smaller'). B explicitly catalogs ~20 ideas as traps with specific failure modes: query-based billing's usage-tracking problem, single-binary's migration liability, auto-resolve's ML-hardness, snapshot-replay's storage explosion, financial-abstraction's skill-set mismatch, timing-channels' false-positive risk. A's risk discussion is parenthetical; B's is systematic and detailed. |
| actionability | base | A closes with a specific recommendation: combine open-source moat + middle market, start with self-hosted, then monetize managed hosting. It names the initial segment (20-500 engineers), the trap to avoid (feature-rich competitor), and the differentiation lever (simpler + more powerful). B ends by provoking deeper exploration of the futures market idea but provides no sketch, risks, or first steps for execution. A moves from diagnosis to strategy; B moves from strategy to provocation. |
| builder_usefulness | base | A gives a builder a coherent path: pick vertical-first or middle-market, build the OSS moat, target specific segment, measure retention/NPS, then expand. It's a roadmap. B is a brainstorm artifact: 15 angles, 20 flagged traps, and a provocation to explore derivatives trading. Useful for expanding thinking, but a builder shipping Monday needs prioritization, not a wider menu. B's trap section is cautionary rather than constructive. A says 'here's what to do'; B says 'here's what not to do' (mostly). |

### agent-tool-choice — ✓ ADHD
_agent-loop · A/B order swapped: false_

> Inside an agent loop, at each step the model must decide whether to call a tool, ask the user a question, or answer directly. Generate strategies for making that decision robustly without thrashing or premature convergence.

**Verdict:** A dominates on breadth, novelty, and trap-spotting (research-grade thoroughness); B wins on focused actionability and shipping pragmatism—A is the better exploration, B is the better execution plan.

| dim | preferred | reason |
| --- | :---: | --- |
| breadth | ADHD | A spans ~15 structurally distinct approaches (confidence thresholds, resource budgeting, pattern-breaking, decision-quality measurement, self-checking, fault-detection, precomputed patterns, model-internals exploitation, state machines, multi-agent consensus, flip-flop detection, bounded attempts). B has ~5 categories with significant overlap (state tracking, budgets, confidence, lookahead, ensemble). A's breadth is substantially wider even accounting for low-signal ideas. |
| novelty | ADHD | A contains genuinely non-standard ideas: decision-fatigue thresholding (immune system metaphor), epigenetic decision memory, gut-flora voting systems, niche specialization scheduling, prediction replay buffers. B sticks to textbook patterns: state tracking, budgets, confidence thresholds, lookahead planning, ensemble voting—all standard RL/agent design tropes. A's metaphor-driven approaches are speculative but distinctly less obvious. |
| trap_detection | ADHD | A explicitly marks 10+ traps with concrete reasons why they fail (exponential backoff delays without fixing root cause, falsifiability checks that meta-loop, logprob manipulation fragility, hardware metaphors misapplied to LLMs). B identifies zero traps; it only discusses tradeoffs. Trap detection is one of the explicit criteria requested in the problem, and A delivers it while B omits it entirely. |
| actionability | ADHD | A's 'Focus' section provides three deeply developed branches (before-tool prediction, mind-change tracking, token watermark) each with: named load-bearing risks, concrete first steps, and 3-5 sub-variations with specific thresholds (>20% mismatch, confidence +5% minimum, 2-step decision patterns). B's recommendation is generic: 'track state and check progress'—no threshold values, no concrete first implementation step, no named risk calibration. |
| builder_usefulness | base | A is intellectually richer but practically overwhelming: 15+ ideas with many marked as traps create decision paralysis. B provides a clear, implementable top recommendation (State + Confidence Thresholds) with explicit next steps and a simple divergence detector sketch. For shipping, B's focused pragmatism (start here, why it works, secondary optimization) beats A's exhaustive-but-theoretical catalog. A is better for research; B is better for product. |

---

_Methodology: each problem run through ADHD (5 frames × 6 ideas, top-3 deepened) and a single-shot baseline using the same model. A/B order randomized per problem to balance positional bias. Judged by a separate LLM call (skeptical staff engineer) doing pairwise A/B/tie preference per dimension — no absolute scores — with an explicit length-is-not-quality instruction._

_Full transcripts: see `bench/results.json`._