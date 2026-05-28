// Pairwise comparison harness (Phase 0, task 0.5).
//
// Why pairwise instead of absolute 1-10 scoring: absolute scales are exactly
// where verbosity bias and arbitrary anchoring live (bench/AUDIT.md). A judge
// asked "rate this 0-10" silently rewards length and formatting; a judge asked
// "which of these two is better, A, B, or neither" is forced into a relative
// decision that is far harder to inflate. This primitive does ONE comparison of
// two artifacts against a list of criteria and returns a preference per
// criterion plus an overall winner.
//
// It is deliberately generic (problem + two strings + criteria) so the same
// harness can drive both the eval (ADHD vs baseline) and, later, tournament
// selection over a shortlist of ideas (task 1.2 reuses this).

import { callLLM, parseJSON } from "../src/llm.js";

export type Pref = "A" | "B" | "tie";

export type Criterion = {
  key: string;          // machine key, e.g. "breadth"
  description: string;  // one-line rubric line the judge reads
};

export type PairResult = {
  perCriterion: Record<string, { winner: Pref; reason: string }>;
  overall: Pref;
  summary: string;
};

const BASE_SYSTEM = `You are a skeptical staff engineer comparing two outputs (A and B) for the
same problem. You do NOT know which system produced which. Decide, for each
criterion, which output is better: "A", "B", or "tie" (genuinely indistinguishable).

LENGTH IS NOT QUALITY. The two outputs may differ greatly in length. Do not
prefer an output for being longer, having more sections, or more formatting. An
output that pads with restatement, boilerplate, or near-duplicate variations of
one idea is WORSE, not better. Judge density of distinct, viable substance — a
concise output that nails a few real angles beats a long one that lists ten
rewordings of the same angle. Reserve "tie" for true parity, not as a hedge.

Output JSON only. No prose preamble.`;

export async function comparePair(
  problem: string,
  outputA: string,
  outputB: string,
  criteria: Criterion[],
  opts: { model?: string; systemExtra?: string } = {},
): Promise<PairResult> {
  const rubric = criteria.map((c) => `- ${c.key}: ${c.description}`).join("\n");
  const shape = criteria
    .map((c) => `  "${c.key}": {"winner": "A" | "B" | "tie", "reason": "..."}`)
    .join(",\n");

  const system = opts.systemExtra ? `${BASE_SYSTEM}\n\n${opts.systemExtra}` : BASE_SYSTEM;

  const userPrompt = `PROBLEM:
${problem}

OUTPUT A:
${outputA}

---

OUTPUT B:
${outputB}

---

Compare A vs B on each criterion. For each, pick the better one ("A", "B", or "tie").

Criteria:
${rubric}

Output JSON of exactly this shape:
{
${shape},
  "overall_winner": "A" | "B" | "tie",
  "one_line_summary": "..."
}`;

  const raw = await callLLM({ model: opts.model, systemPrompt: system, userPrompt });
  const parsed = parseJSON<
    Record<string, { winner: Pref; reason: string }> & {
      overall_winner: Pref;
      one_line_summary: string;
    }
  >(raw);

  const perCriterion: PairResult["perCriterion"] = {};
  for (const c of criteria) {
    const v = parsed[c.key] as { winner: Pref; reason: string } | undefined;
    perCriterion[c.key] = {
      winner: v?.winner ?? "tie",
      reason: v?.reason ?? "",
    };
  }

  return {
    perCriterion,
    overall: parsed.overall_winner ?? "tie",
    summary: parsed.one_line_summary ?? "",
  };
}
