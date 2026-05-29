# ADHD vs Chain-of-Thought and Tree-of-Thought

[← back to README](../README.md)

Easy to conflate. They are structurally different.

| | Chain-of-Thought | Tree-of-Thought | **ADHD** |
|---|---|---|---|
| **Threads** | one, linear | one tree, walked | **N parallel, isolated** |
| **Branches share context** | yes | yes (one session) | **no — each branch is its own `query()`** |
| **Generator vs critic** | same step | same model, alternating | **separated phases, separate LLM calls, opposite system prompts** |
| **Branching driver** | none | next-step variations | **cognitive frames** — re-ask the *whole question* from a different vantage point |
| **Parallelism** | sequential | mostly sequential | **true concurrent API calls** |
| **Goal** | correct reasoning | find a solving path | **escape premature convergence; surface non-obvious viable options** |
| **Right for** | math, multi-step logic | search, planning, puzzles | **open-ended design & ideation** |

## The three load-bearing differences

**1. Isolation, not search.**
CoT and ToT branches share a context window — by step 4, the model has anchored on what it wrote in steps 1–3. ADHD branches **never see each other** during divergence. Anchoring is eliminated by construction, not by prompting.

**2. Frames, not next-step variation.**
ToT branches typically vary the next move ("try this number / try that number"). ADHD varies the *entire vantage point of the generator*. It's not "what's the next step from here," it's *"re-ask the whole question as if you were an immune system."* That produces structurally different ideas, not nearby ones — which is what interdisciplinary work needs.

**3. Generator–critic split is mechanical, not promised.**
In CoT and ToT, the model evaluates as it goes. ADHD makes divergence its own LLM call with a system prompt that *forbids* evaluation. Convergence is a separate call with the opposite posture. Two postures, two passes, mutually exclusive.

## One-sentence version

> CoT makes one head think slower. ToT makes one head search wider. **ADHD makes many heads think differently, in parallel, then has a critic pick.**

## Pop-sci version

> CoT is one careful person reasoning aloud. ToT is one person playing chess looking N moves ahead. **ADHD is a brainstorm room with a hardware engineer, a regulator, a 10-year-old, and a speedrunner in it — then a separate room with the editor.**

## Where it overlaps with ToT

ADHD *is* a tree-of-thought variant: the deepen pass literally expands top-K nodes. What's new is **what drives the branching** (frames, not next-step) and **how the generator/critic split is enforced** (separate LLM calls, separate system prompts, zero shared context during divergence).

## A note on frames vs personas

Frames are **not** personas. Persona-prompting research (e.g. *"you are John, a 34-year-old engineer"*) studies simulated identities; some findings report that ordinary attribute-personas outperform curated expert-personas. ADHD frames are neither — they are *vantage operators* (*"you think in latency, memory layout, and physical constraints"*) that re-pose the problem, not identities the model role-plays. The mechanisms are different, so the persona findings do not map directly onto frame selection. (Tracked in [issue #17](https://github.com/UditAkhourii/adhd/issues/17).)
