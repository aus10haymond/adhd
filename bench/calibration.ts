#!/usr/bin/env node
// Human-vs-LLM judge calibration (Phase 0, task 0.6).
//
// The eval trusts an LLM judge. This harness checks that trust against a human:
// a person rates the same blinded A/B comparisons the judge saw, and we report
// how often the two agree. Low agreement means the scoreboard is not credible.
//
// Two modes:
//   npx tsx bench/calibration.ts prepare   # write blinded docs from results.json
//   npx tsx bench/calibration.ts report    # compare human-ratings.json to the judge
//
// Blinding: prepare reuses each problem's stored `swapped` flag so "Output A" in
// the doc is the SAME side the judge labelled A. The A->system key is written to
// bench/calibration/_key.json, which the rater must not open until after rating.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

// The 5 calibration problems — one per distinct problem shape (task 0.6).
const CALIBRATION_IDS = [
  "lru-100ms",
  "llm-hang-cli",
  "fuzzy-bug",
  "monolith-split",
  "naming-feature-flag",
];

const DIMS = ["breadth", "novelty", "trap_detection", "actionability", "builder_usefulness"];

type Pref = "A" | "B" | "tie";

type ResultRow = {
  problemId: string;
  problem: string;
  swapped: boolean;
  baselineOutput: string;
  adhdOutput: string;
  verdict: {
    // new pairwise schema
    overall?: Pref;
    perCriterion?: Record<string, { winner: Pref; reason: string }>;
    // tolerate the pre-0.5 absolute-score schema
    overall_winner?: Pref;
  };
};

function loadResults(): ResultRow[] {
  return JSON.parse(readFileSync("bench/results.json", "utf8"));
}

// Read the judge's overall/per-dim preference in raw A/B/tie space, tolerating
// both the pairwise (0.5+) and the older absolute-score schema.
function llmOverall(r: ResultRow): Pref {
  return r.verdict.overall ?? r.verdict.overall_winner ?? "tie";
}
function llmDim(r: ResultRow, key: string): Pref {
  return r.verdict.perCriterion?.[key]?.winner ?? "tie";
}

// Translate a raw A/B preference into "did ADHD win" using the swap mapping.
function toAdhd(pref: Pref, swapped: boolean): "ADHD" | "baseline" | "tie" {
  const adhdLabel = swapped ? "B" : "A";
  const baseLabel = swapped ? "A" : "B";
  if (pref === adhdLabel) return "ADHD";
  if (pref === baseLabel) return "baseline";
  return "tie";
}

function prepare() {
  const results = loadResults();
  const dir = "bench/calibration";
  mkdirSync(dir, { recursive: true });

  const key: Record<string, { swapped: boolean; aIs: string; bIs: string }> = {};
  let written = 0;

  for (const id of CALIBRATION_IDS) {
    const r = results.find((x) => x.problemId === id);
    if (!r) {
      console.error(`  ! ${id} not in bench/results.json — run the eval first; skipping`);
      continue;
    }
    // "Output A" in the doc must equal the judge's "A": if swapped, A=baseline.
    const outA = r.swapped ? r.baselineOutput : r.adhdOutput;
    const outB = r.swapped ? r.adhdOutput : r.baselineOutput;

    const doc = [
      `# Calibration — ${id}`,
      "",
      `> ${r.problem}`,
      "",
      `Read both outputs and decide which is better per the rubric. Record your`,
      `preference for "${id}" in bench/human-ratings.json. Judge substance, not length.`,
      "",
      "---",
      "",
      "## Output A",
      "",
      outA,
      "",
      "---",
      "",
      "## Output B",
      "",
      outB,
      "",
    ].join("\n");

    writeFileSync(`${dir}/${id}.md`, doc);
    key[id] = {
      swapped: r.swapped,
      aIs: r.swapped ? "baseline" : "adhd",
      bIs: r.swapped ? "adhd" : "baseline",
    };
    written++;
  }

  writeFileSync(`${dir}/_key.json`, JSON.stringify(key, null, 2));

  console.error(`✓ wrote ${written} blinded comparison doc(s) to ${dir}/`);
  console.error(`  Next: copy bench/human-ratings.template.json -> bench/human-ratings.json,`);
  console.error(`  fill in A/B/tie per problem, then run: npm run calib:report`);
  console.error(`  (Do not open ${dir}/_key.json until you've rated.)`);
}

function report() {
  if (!existsSync("bench/human-ratings.json")) {
    console.error("! bench/human-ratings.json not found.");
    console.error("  Copy bench/human-ratings.template.json -> bench/human-ratings.json and fill it in.");
    process.exit(1);
  }
  const human = JSON.parse(readFileSync("bench/human-ratings.json", "utf8"));
  const ratings: Array<Record<string, string>> = human.ratings ?? [];
  const results = loadResults();

  const norm = (v: string | undefined): Pref | null => {
    if (!v) return null;
    const s = v.trim().toLowerCase();
    if (s === "a") return "A";
    if (s === "b") return "B";
    if (s === "tie") return "tie";
    return null;
  };

  let overallAgree = 0;
  let overallTotal = 0;
  const dimAgree: Record<string, { agree: number; total: number }> = {};
  for (const d of DIMS) dimAgree[d] = { agree: 0, total: 0 };

  const rows: string[] = [];
  for (const hr of ratings) {
    const id = hr.problemId;
    const r = results.find((x) => x.problemId === id);
    if (!r) continue;
    const ho = norm(hr.overall);
    if (ho === null) continue; // unrated — skip

    const lo = llmOverall(r);
    overallTotal++;
    const agree = ho === lo;
    if (agree) overallAgree++;

    for (const d of DIMS) {
      const hd = norm(hr[d]);
      if (hd === null) continue;
      dimAgree[d].total++;
      if (hd === llmDim(r, d)) dimAgree[d].agree++;
    }

    rows.push(
      `| ${id} | ${toAdhd(ho, r.swapped)} | ${toAdhd(lo, r.swapped)} | ${agree ? "✓" : "✗"} |`,
    );
  }

  const pct = (a: number, t: number) => (t === 0 ? "—" : `${Math.round((a / t) * 100)}% (${a}/${t})`);

  const out: string[] = [];
  out.push(`# Judge calibration — human vs LLM`);
  out.push("");
  out.push(`Generated: ${new Date().toISOString()}`);
  out.push("");
  out.push(`**Overall agreement: ${pct(overallAgree, overallTotal)}**`);
  out.push("");
  out.push(`## Overall winner, per problem (translated to ADHD vs baseline)`);
  out.push("");
  out.push(`| Problem | Human | LLM judge | Agree |`);
  out.push(`| --- | :---: | :---: | :---: |`);
  out.push(...rows);
  out.push("");
  out.push(`## Per-dimension agreement`);
  out.push("");
  out.push(`| Dimension | Agreement |`);
  out.push(`| --- | ---: |`);
  for (const d of DIMS) out.push(`| ${d} | ${pct(dimAgree[d].agree, dimAgree[d].total)} |`);
  out.push("");
  out.push(`_Agreement is raw A/B/tie match on the same blinded comparison. With a 5-problem_`);
  out.push(`_subset this is a smoke test, not a statistic; treat <60% overall agreement as a_`);
  out.push(`_red flag that the judge is not tracking human preference._`);

  const md = out.join("\n");
  writeFileSync("bench/calibration/AGREEMENT.md", md);
  console.error(md);
  console.error(`\n✓ wrote bench/calibration/AGREEMENT.md`);
}

const mode = process.argv[2];
if (mode === "prepare") prepare();
else if (mode === "report") report();
else {
  console.error("usage: tsx bench/calibration.ts <prepare|report>");
  process.exit(1);
}
