// Idea-duplication metric (Phase 0, task 0.9).
//
// Why measure this now: a divergent fan-out is only valuable if the branches
// produce DIFFERENT ideas. If frames keep landing on the same idea, the critic
// burns budget ranking duplicates and the "breadth" advantage is fake. We need a
// duplication baseline before Phase 2 adds a dedup pass, so we can prove that
// pass actually removed redundancy rather than just asserting it.
//
// Method: a dependency-free LEXICAL proxy — token-set Jaccard similarity, then
// greedy transitive clustering at a threshold. No embeddings (no API key / no
// embedding dep available here) and no per-run judge call (would add cost and
// the judge noise we're trying to control). It catches near-identical phrasings;
// it will miss paraphrases that share few words. Phase 2 may replace it with a
// semantic check — `duplicationRate` is the stable interface either way.

export type DedupResult = {
  total: number;        // ideas considered
  unique: number;       // distinct clusters after merging near-duplicates
  duplicates: number;   // total - unique (ideas a perfect dedup pass would drop)
  rate: number;         // duplicates / total, 0..1
  threshold: number;    // Jaccard threshold used
};

function tokenSet(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

export function duplicationRate(texts: string[], threshold = 0.5): DedupResult {
  const total = texts.length;
  if (total === 0) return { total: 0, unique: 0, duplicates: 0, rate: 0, threshold };

  const sets = texts.map(tokenSet);

  // Union-find over near-duplicate pairs → transitive clusters.
  const parent = texts.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (i: number, j: number) => { parent[find(i)] = find(j); };

  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      if (jaccard(sets[i], sets[j]) >= threshold) union(i, j);
    }
  }

  const roots = new Set<number>();
  for (let i = 0; i < total; i++) roots.add(find(i));
  const unique = roots.size;
  const duplicates = total - unique;
  return { total, unique, duplicates, rate: duplicates / total, threshold };
}
