#!/usr/bin/env node
// bench:compare (task 0.11) — diff a run against the frozen Phase-0 baseline.
//
// Usage:
//   npx tsx bench/compare.ts                 # compares bench/results.json
//   npx tsx bench/compare.ts --run bench/runs/<date>-phase1/results.json
//
// Reads the immutable baseline/metrics.json and recomputes the same aggregate
// from a run's results.json (via the shared computeMetrics), then prints deltas
// on every metric PLAN.md gates phases on: win rate, per-dimension wins, cost,
// latency, length, duplication. This is the scoreboard each later phase is
// measured against — it does not pass/fail, it shows you the movement.

import { readFileSync, existsSync } from "node:fs";
import { computeMetrics, type Metrics, type RowResult } from "./metrics.js";

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const BASELINE_PATH = "baseline/metrics.json";
const runPath = getArg("--run") ?? "bench/results.json";

if (!existsSync(BASELINE_PATH)) {
  console.error(`✗ no baseline at ${BASELINE_PATH} — run \`npm run bench:baseline\` first (PLAN.md 0.10).`);
  process.exit(1);
}
if (!existsSync(runPath)) {
  console.error(`✗ no run results at ${runPath} — run \`npm run evals\` first, or pass --run <path>.`);
  process.exit(1);
}

// baseline/metrics.json is { meta, ...Metrics }; results.json is RowResult[].
const baseline: Metrics & { meta?: { model?: string; git?: { sha?: string } } } =
  JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
const rows: RowResult[] = JSON.parse(readFileSync(runPath, "utf8"));
const current = computeMetrics(rows);

const pct = (x: number) => (x * 100).toFixed(0) + "%";
const usd = (x: number) => "$" + x.toFixed(4);
const f1 = (x: number) => x.toFixed(1);
// Signed delta, with a direction hint. `goodUp` says whether an increase is the
// improvement (win rate up = good; cost up = bad) so the arrow reads correctly.
function delta(base: number, cur: number, fmt: (n: number) => string, goodUp: boolean): string {
  const d = cur - base;
  if (Math.abs(d) < 1e-9) return `${fmt(cur)}  (=)`;
  const up = d > 0;
  const good = up === goodUp;
  const arrow = up ? "▲" : "▼";
  const mark = good ? "+" : "-"; // improvement vs regression, independent of sign
  return `${fmt(cur)}  (${arrow} ${fmt(Math.abs(d))} ${mark})`;
}

const lines: string[] = [];
lines.push(`# bench:compare — run vs baseline`);
lines.push("");
lines.push(`Baseline: ${baseline.meta?.model ?? "?"} @ ${baseline.meta?.git?.sha?.slice(0, 7) ?? "?"} · ${baseline.problemCount} problems`);
lines.push(`Run:      ${runPath} · ${current.problemCount} problems`);
if (baseline.problemCount !== current.problemCount) {
  lines.push("");
  lines.push(`! problem counts differ (${baseline.problemCount} vs ${current.problemCount}) — deltas are not strictly like-for-like.`);
}
lines.push("");
lines.push(`## Headline`);
lines.push(`- win rate:        baseline ${pct(baseline.overall.adhdWinRate)}  →  ${delta(baseline.overall.adhdWinRate, current.overall.adhdWinRate, pct, true)}`);
lines.push(`- record (W/L/T):  baseline ${baseline.overall.adhdWins}/${baseline.overall.baselineWins}/${baseline.overall.ties}  →  run ${current.overall.adhdWins}/${current.overall.baselineWins}/${current.overall.ties}`);
lines.push("");
lines.push(`## Per-dimension ADHD wins (W/L/T)`);
for (const d of Object.keys(current.perDimension)) {
  const b = baseline.perDimension[d];
  const c = current.perDimension[d];
  const base = b ? `${b.adhdWins}/${b.baselineWins}/${b.ties}` : "—";
  lines.push(`- ${d.padEnd(20)} baseline ${base.padEnd(10)} →  run ${c.adhdWins}/${c.baselineWins}/${c.ties}`);
}
lines.push("");
lines.push(`## Cost / latency / length / duplication`);
lines.push(`- total cost (USD):   baseline ${usd(baseline.cost.adhdUSD)}  →  ${delta(baseline.cost.adhdUSD, current.cost.adhdUSD, usd, false)}`);
lines.push(`- mean latency (s):   baseline ${f1(baseline.cost.meanAdhdMs / 1000)}  →  ${delta(baseline.cost.meanAdhdMs / 1000, current.cost.meanAdhdMs / 1000, f1, false)}`);
lines.push(`- mean length (tok):  baseline ${baseline.length.meanAdhdTokens.toFixed(0)}  →  run ${current.length.meanAdhdTokens.toFixed(0)}`);
lines.push(`- duplication rate:   baseline ${pct(baseline.duplication.meanRate)}  →  ${delta(baseline.duplication.meanRate, current.duplication.meanRate, pct, false)}`);
lines.push("");
lines.push(`_(▲/▼ = direction; +/- = improvement/regression. Pass criteria live in PLAN.md per phase.)_`);

console.log(lines.join("\n"));
