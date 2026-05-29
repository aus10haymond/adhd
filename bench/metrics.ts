// Shared metric shapes + aggregation for the eval harness. Extracted so the
// runner (run-evals.ts) and the baseline comparison (compare.ts, task 0.11)
// compute identical aggregates from the identical RowResult shape — bench:compare
// must diff like-for-like, and a second hand-rolled copy would silently drift.

import type { CallUsage } from "../src/types.js";
import { DIMENSIONS, type Verdict } from "./judge.js";
import type { LengthMeasure } from "./length.js";
import type { DedupResult } from "./dedup.js";

export type RowResult = {
  problemId: string;
  category: string;
  problem: string;
  swapped: boolean;            // if true, A=baseline, B=adhd; else A=adhd, B=baseline
  baselineOutput: string;
  adhdOutput: string;
  lengths: { adhd: LengthMeasure; baseline: LengthMeasure }; // task 0.3 instrumentation
  cost: {                                                    // task 0.8 instrumentation
    adhd: { usage: CallUsage; ms: number };
    baseline: { usage: CallUsage; ms: number };
  };
  dedup: DedupResult;                                        // task 0.9: ADHD idea duplication
  verdict: Verdict;
};

export type Outcome = "win" | "loss" | "tie";

// Map a blinded A/B/tie preference back to ADHD's perspective via `swapped`.
export function fromAdhd(pref: "A" | "B" | "tie", swapped: boolean): Outcome {
  const adhdLabel = swapped ? "B" : "A";
  const baseLabel = swapped ? "A" : "B";
  if (pref === adhdLabel) return "win";
  if (pref === baseLabel) return "loss";
  return "tie";
}
export function adhdDim(r: RowResult, key: string): Outcome {
  return fromAdhd(r.verdict.perCriterion[key]?.winner ?? "tie", r.swapped);
}
export function adhdWon(r: RowResult): Outcome {
  return fromAdhd(r.verdict.overall, r.swapped);
}

// Machine-readable aggregate metrics — the canonical numbers bench:compare
// (task 0.11) diffs a later run against, and what writeBaseline freezes.
export type Metrics = ReturnType<typeof computeMetrics>;

export function computeMetrics(rows: RowResult[]) {
  const dims = DIMENSIONS.map((d) => d.key);
  const n = rows.length;
  const count = (f: (r: RowResult) => boolean) => rows.filter(f).length;
  const sum = (sel: (r: RowResult) => number) => rows.reduce((s, r) => s + sel(r), 0);

  const perDimension: Record<string, { adhdWins: number; baselineWins: number; ties: number }> = {};
  for (const d of dims) {
    perDimension[d] = {
      adhdWins: count((r) => adhdDim(r, d) === "win"),
      baselineWins: count((r) => adhdDim(r, d) === "loss"),
      ties: count((r) => adhdDim(r, d) === "tie"),
    };
  }

  const meanAdhdTok = sum((r) => r.lengths.adhd.estTokens) / n;
  const meanBaseTok = sum((r) => r.lengths.baseline.estTokens) / n;
  const adhdUSD = sum((r) => r.cost.adhd.usage.costUSD);
  const baseUSD = sum((r) => r.cost.baseline.usage.costUSD);

  return {
    problemCount: n,
    overall: {
      adhdWins: count((r) => adhdWon(r) === "win"),
      baselineWins: count((r) => adhdWon(r) === "loss"),
      ties: count((r) => adhdWon(r) === "tie"),
      adhdWinRate: count((r) => adhdWon(r) === "win") / n,
    },
    perDimension,
    length: {
      meanAdhdTokens: meanAdhdTok,
      meanBaselineTokens: meanBaseTok,
      ratio: meanBaseTok === 0 ? null : meanAdhdTok / meanBaseTok,
    },
    cost: {
      adhdUSD,
      baselineUSD: baseUSD,
      ratioUSD: baseUSD === 0 ? null : adhdUSD / baseUSD,
      adhdInputTokens: sum((r) => r.cost.adhd.usage.inputTokens),
      adhdOutputTokens: sum((r) => r.cost.adhd.usage.outputTokens),
      baselineInputTokens: sum((r) => r.cost.baseline.usage.inputTokens),
      baselineOutputTokens: sum((r) => r.cost.baseline.usage.outputTokens),
      meanAdhdMs: sum((r) => r.cost.adhd.ms) / n,
      meanBaselineMs: sum((r) => r.cost.baseline.ms) / n,
    },
    duplication: {
      meanRate: rows.reduce((s, r) => s + r.dedup.rate, 0) / n,
      totalIdeas: sum((r) => r.dedup.total),
      totalDuplicates: sum((r) => r.dedup.duplicates),
      threshold: rows[0]?.dedup.threshold ?? null,
    },
  };
}
