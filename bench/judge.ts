// LLM-as-judge for the eval.
//
// We can't ground-truth ideation, so we use a separate critic pass to compare
// two outputs (ADHD vs baseline) on the dimensions that matter for *open-ended*
// design work: breadth, novelty, trap detection, actionability, and overall
// usefulness to a builder.
//
// As of task 0.5 the judge is PAIRWISE: instead of rating each output 0-10 (an
// absolute scale that quietly rewards verbosity), it picks a winner per
// dimension ("A", "B", or "tie"). The actual comparison logic lives in the
// reusable harness `comparePair` (bench/pairwise.ts); this module only defines
// the eval's rubric. To reduce same-model bias the judge reads adversarially
// ("skeptical staff engineer") and sees both outputs blinded, in an A/B order
// the caller randomizes per problem.

import { comparePair, type Criterion, type PairResult } from "./pairwise.js";

// Re-exported as the eval's verdict type; it's a plain pairwise result.
export type Verdict = PairResult;

export const DIMENSIONS: Criterion[] = [
  { key: "breadth", description: "range of structurally DISTINCT angles. Ten minor variations of one idea = low breadth." },
  { key: "novelty", description: "how many ideas are non-obvious-but-viable. The obvious textbook answer is NOT novel." },
  { key: "trap_detection", description: "does it name ideas that look good but are traps, with reasons?" },
  { key: "actionability", description: "does the top recommendation have a sketch, named risk, and first concrete step?" },
  { key: "builder_usefulness", description: "if you had to ship, which is more useful to you?" },
];

export async function judge(
  problem: string,
  outputA: string,
  outputB: string,
  model?: string,
): Promise<Verdict> {
  return comparePair(problem, outputA, outputB, DIMENSIONS, { model });
}
