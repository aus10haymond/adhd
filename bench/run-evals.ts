#!/usr/bin/env node
// Eval runner. Compares ADHD vs a single-shot baseline across a problem set,
// scores both with an LLM-as-judge, writes EVALS.md with verdicts + aggregates.
//
// Usage:
//   npx tsx bench/run-evals.ts                  # full suite
//   npx tsx bench/run-evals.ts --problem lru-100ms
//   npx tsx bench/run-evals.ts --quick          # only first 2 problems
//
// Order of A/B in the prompt is randomized per problem to balance positional
// bias; the mapping is recorded so aggregates can be computed correctly.

import { readFileSync, writeFileSync } from "node:fs";
import { run } from "../src/index.js";
import { renderText } from "../src/render.js";
import { callLLM, emptyUsage } from "../src/llm.js";
import type { CallUsage } from "../src/types.js";
import { judge, DIMENSIONS, type Verdict } from "./judge.js";
import { measure, type LengthMeasure } from "./length.js";

type Problem = { id: string; category: string; problem: string };

const BASELINE_SYSTEM =
  "You are a thoughtful senior engineer. When asked to ideate on a problem, " +
  "give a useful answer with multiple approaches, tradeoffs, and a recommendation. " +
  "Be substantive but not bloated.";

// Each arm returns its output plus what it cost: token/USD usage and wall-clock.
type Generated = { text: string; usage: CallUsage; ms: number };

async function baseline(problem: string): Promise<Generated> {
  let usage = emptyUsage();
  const t0 = Date.now();
  const text = await callLLM({
    systemPrompt: BASELINE_SYSTEM,
    userPrompt: `Ideate on this engineering problem:\n\n${problem}\n\nGive the user a useful answer.`,
    onUsage: (u) => { usage = u; },
  });
  return { text, usage, ms: Date.now() - t0 };
}

async function adhd(problem: string): Promise<Generated> {
  const t0 = Date.now();
  const result = await run({
    problem,
    framesPerRun: 5,
    ideasPerFrame: 6,
    topK: 3,
    concurrency: 4,
    codeMode: true,
    onEvent: () => {},
  });
  // Strip ANSI for the judge — color codes are noise to the model. Omit the
  // self-rating chips too: stripping ANSI leaves the literal "[N V F]" text,
  // which is a self-score the baseline arm has no equivalent of (bench/AUDIT.md).
  const text = renderText(result, { chips: false }).replace(/\x1b\[[0-9;]*m/g, "");
  return { text, usage: result.usage, ms: Date.now() - t0 };
}

type RowResult = {
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
  verdict: Verdict;
};

function getArg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const allProblems: Problem[] = JSON.parse(
    readFileSync(new URL("./problems.json", import.meta.url), "utf8"),
  );

  const onlyId = getArg("--problem");
  const quick = hasFlag("--quick");
  let problems = onlyId ? allProblems.filter((p) => p.id === onlyId) : allProblems;
  if (quick) problems = problems.slice(0, 2);

  console.error(`▸ running ${problems.length} eval(s)`);

  const rows: RowResult[] = [];
  for (const p of problems) {
    console.error(`\n— ${p.id} (${p.category})`);

    console.error("  · generating baseline…");
    const base = await baseline(p.problem);

    console.error("  · generating ADHD…");
    const adhdGen = await adhd(p.problem);

    // Randomize A/B order so the judge's positional bias is balanced.
    const swapped = Math.random() < 0.5;
    const outA = swapped ? base.text : adhdGen.text;
    const outB = swapped ? adhdGen.text : base.text;

    console.error("  · judging…");
    const verdict = await judge(p.problem, outA, outB);

    rows.push({
      problemId: p.id,
      category: p.category,
      problem: p.problem,
      swapped,
      baselineOutput: base.text,
      adhdOutput: adhdGen.text,
      lengths: { adhd: measure(adhdGen.text), baseline: measure(base.text) },
      cost: {
        adhd: { usage: adhdGen.usage, ms: adhdGen.ms },
        baseline: { usage: base.usage, ms: base.ms },
      },
      verdict,
    });

    const adhdLabel = swapped ? "B" : "A";
    const baseLabel = swapped ? "A" : "B";
    const outcome =
      verdict.overall === adhdLabel ? "ADHD wins" :
      verdict.overall === baseLabel ? "baseline wins" : "tie";
    console.error(`  → ${outcome} :: ${verdict.summary}`);
  }

  writeReport(rows);
  writeJson(rows);
  console.error(`\n✓ wrote EVALS.md + bench/results.json`);
}

type Outcome = "win" | "loss" | "tie";

// Map a blinded A/B/tie preference back to ADHD's perspective via `swapped`.
function fromAdhd(pref: "A" | "B" | "tie", swapped: boolean): Outcome {
  const adhdLabel = swapped ? "B" : "A";
  const baseLabel = swapped ? "A" : "B";
  if (pref === adhdLabel) return "win";
  if (pref === baseLabel) return "loss";
  return "tie";
}
function adhdDim(r: RowResult, key: string): Outcome {
  return fromAdhd(r.verdict.perCriterion[key]?.winner ?? "tie", r.swapped);
}
function adhdWon(r: RowResult): Outcome {
  return fromAdhd(r.verdict.overall, r.swapped);
}

function writeReport(rows: RowResult[]) {
  const dims = DIMENSIONS.map((d) => d.key);

  const wins = rows.filter((r) => adhdWon(r) === "win").length;
  const losses = rows.filter((r) => adhdWon(r) === "loss").length;
  const ties = rows.filter((r) => adhdWon(r) === "tie").length;

  const fmt = (n: number) => n.toFixed(2);

  const lines: string[] = [];
  lines.push(`# ADHD vs baseline — evals`);
  lines.push("");
  lines.push(`Run: ${new Date().toISOString()} · problems: ${rows.length}`);
  lines.push("");
  lines.push(`**Headline:** ADHD ${wins}W / ${losses}L / ${ties}T vs single-shot baseline (pairwise overall).`);
  lines.push("");
  lines.push(`## Pairwise wins by dimension`);
  lines.push("");
  lines.push(`Per-dimension A/B preference (no absolute scores — see task 0.5). Each cell`);
  lines.push(`counts how often ADHD was preferred / baseline preferred / tie, across ${rows.length} problems.`);
  lines.push("");
  lines.push(`| Dimension | ADHD W | base W | tie |`);
  lines.push(`| --- | ---: | ---: | ---: |`);
  for (const d of dims) {
    const w = rows.filter((r) => adhdDim(r, d) === "win").length;
    const l = rows.filter((r) => adhdDim(r, d) === "loss").length;
    const t = rows.filter((r) => adhdDim(r, d) === "tie").length;
    lines.push(`| ${d} | ${w} | ${l} | ${t} |`);
  }
  lines.push("");
  lines.push(`## Output length (task 0.3 instrumentation)`);
  lines.push("");
  lines.push(`Length of the artifact the judge actually reads, per problem. The ratio`);
  lines.push(`exposes verbosity asymmetry — if ADHD wins are concentrated where its ratio`);
  lines.push(`is highest, the win may be length-driven (see task 0.4).`);
  lines.push("");
  lines.push(`| Problem | ADHD tok | Base tok | ADHD:Base | Winner |`);
  lines.push(`| --- | ---: | ---: | ---: | :---: |`);
  for (const r of rows) {
    const ratio = r.lengths.baseline.estTokens === 0
      ? "—"
      : (r.lengths.adhd.estTokens / r.lengths.baseline.estTokens).toFixed(2) + "×";
    const w = adhdWon(r) === "win" ? "ADHD" : adhdWon(r) === "loss" ? "base" : "tie";
    lines.push(`| ${r.problemId} | ${r.lengths.adhd.estTokens} | ${r.lengths.baseline.estTokens} | ${ratio} | ${w} |`);
  }
  const meanAdhdTok = rows.reduce((s, r) => s + r.lengths.adhd.estTokens, 0) / rows.length;
  const meanBaseTok = rows.reduce((s, r) => s + r.lengths.baseline.estTokens, 0) / rows.length;
  const meanRatio = meanBaseTok === 0 ? "—" : (meanAdhdTok / meanBaseTok).toFixed(2) + "×";
  lines.push(`| **mean** | **${fmt(meanAdhdTok)}** | **${fmt(meanBaseTok)}** | **${meanRatio}** | |`);
  lines.push("");
  lines.push(`_estTokens = chars/4 (estimate); exact chars + words per output are in \`bench/results.json\`._`);
  lines.push("");

  // Win rate stratified by the ADHD:baseline length ratio. If ADHD wins
  // concentrate in the high-ratio buckets, the win is plausibly length-driven
  // rather than substance-driven — the verbosity-bias check from task 0.4.
  lines.push(`## Win rate by length bucket (task 0.4)`);
  lines.push("");
  lines.push(`Problems grouped by ADHD:baseline length ratio. If ADHD's wins cluster in`);
  lines.push(`the high-ratio buckets, the headline may be verbosity-driven, not substance.`);
  lines.push("");
  const buckets = [
    { label: "≤ 2× (similar length)", test: (r: number) => r <= 2 },
    { label: "2×–4×", test: (r: number) => r > 2 && r <= 4 },
    { label: "> 4× (much longer)", test: (r: number) => r > 4 },
  ];
  lines.push(`| Length ratio | n | ADHD W | L | T | ADHD win rate |`);
  lines.push(`| --- | ---: | ---: | ---: | ---: | ---: |`);
  for (const b of buckets) {
    const inB = rows.filter((r) => {
      const ratio = r.lengths.baseline.estTokens === 0 ? Infinity : r.lengths.adhd.estTokens / r.lengths.baseline.estTokens;
      return b.test(ratio);
    });
    const w = inB.filter((r) => adhdWon(r) === "win").length;
    const l = inB.filter((r) => adhdWon(r) === "loss").length;
    const t = inB.filter((r) => adhdWon(r) === "tie").length;
    const rate = inB.length === 0 ? "—" : `${Math.round((w / inB.length) * 100)}%`;
    lines.push(`| ${b.label} | ${inB.length} | ${w} | ${l} | ${t} | ${rate} |`);
  }
  lines.push("");
  lines.push(`_With a small problem set these buckets are thin; the signal sharpens as the_`);
  lines.push(`_problem count grows (task 0.7)._`);
  lines.push("");

  // Cost & latency (task 0.8): the honest price of the win. ADHD makes many
  // parallel calls; this is where "is the lift worth the spend" gets answered.
  const sum = (sel: (r: RowResult) => number) => rows.reduce((s, r) => s + sel(r), 0);
  const adhdUSD = sum((r) => r.cost.adhd.usage.costUSD);
  const baseUSD = sum((r) => r.cost.baseline.usage.costUSD);
  const adhdOut = sum((r) => r.cost.adhd.usage.outputTokens);
  const baseOut = sum((r) => r.cost.baseline.usage.outputTokens);
  const adhdIn = sum((r) => r.cost.adhd.usage.inputTokens);
  const baseIn = sum((r) => r.cost.baseline.usage.inputTokens);
  const adhdMs = sum((r) => r.cost.adhd.ms) / rows.length;
  const baseMs = sum((r) => r.cost.baseline.ms) / rows.length;
  const xOf = (a: number, b: number) => (b === 0 ? "—" : (a / b).toFixed(1) + "×");
  const usd = (n: number) => "$" + n.toFixed(4);
  lines.push(`## Cost & latency (task 0.8)`);
  lines.push("");
  lines.push(`Summed across ${rows.length} problem(s); the multiplier is ADHD relative to baseline.`);
  lines.push(`Judge calls are eval overhead and are not counted here.`);
  lines.push("");
  lines.push(`| Metric | ADHD | Baseline | ADHD/base |`);
  lines.push(`| --- | ---: | ---: | ---: |`);
  lines.push(`| total cost (USD) | ${usd(adhdUSD)} | ${usd(baseUSD)} | ${xOf(adhdUSD, baseUSD)} |`);
  lines.push(`| input tokens | ${adhdIn} | ${baseIn} | ${xOf(adhdIn, baseIn)} |`);
  lines.push(`| output tokens | ${adhdOut} | ${baseOut} | ${xOf(adhdOut, baseOut)} |`);
  lines.push(`| mean latency (s) | ${(adhdMs / 1000).toFixed(1)} | ${(baseMs / 1000).toFixed(1)} | ${xOf(adhdMs, baseMs)} |`);
  lines.push("");
  lines.push(`_Per-problem usage + wall-clock are in \`bench/results.json\`._`);
  lines.push("");
  lines.push(`## Per-problem verdicts`);
  lines.push("");
  for (const r of rows) {
    const winner = adhdWon(r) === "win" ? "✓ ADHD" : adhdWon(r) === "loss" ? "✗ baseline" : "= tie";
    lines.push(`### ${r.problemId} — ${winner}`);
    lines.push(`_${r.category} · A/B order swapped: ${r.swapped}_`);
    lines.push("");
    lines.push(`> ${r.problem}`);
    lines.push("");
    lines.push(`**Verdict:** ${r.verdict.summary}`);
    lines.push("");
    lines.push(`| dim | preferred | reason |`);
    lines.push(`| --- | :---: | --- |`);
    for (const d of dims) {
      const o = adhdDim(r, d);
      const pref = o === "win" ? "ADHD" : o === "loss" ? "base" : "tie";
      const reason = (r.verdict.perCriterion[d]?.reason ?? "").replace(/\|/g, "\\|");
      lines.push(`| ${d} | ${pref} | ${reason} |`);
    }
    lines.push("");
  }
  lines.push("---");
  lines.push("");
  lines.push(`_Methodology: each problem run through ADHD (5 frames × 6 ideas, top-3 deepened) and a single-shot baseline using the same model. A/B order randomized per problem to balance positional bias. Judged by a separate LLM call (skeptical staff engineer) doing pairwise A/B/tie preference per dimension — no absolute scores — with an explicit length-is-not-quality instruction._`);
  lines.push("");
  lines.push(`_Full transcripts: see \`bench/results.json\`._`);

  writeFileSync("EVALS.md", lines.join("\n"));
}

function writeJson(rows: RowResult[]) {
  writeFileSync("bench/results.json", JSON.stringify(rows, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
