// Output-length instrumentation for the eval (Phase 0, task 0.3).
//
// Why this exists: the audit (bench/AUDIT.md) flags length / verbosity as the
// single biggest suspected source of unearned win-rate for ADHD — the judge may
// be rewarding the longer artifact, not the better one. To control for that
// (task 0.4) we first have to *measure* how long each judged artifact is.
//
// Why not the API token counter: the eval runs under local Claude Code auth with
// no ANTHROPIC_API_KEY, and the base @anthropic-ai/sdk (which exposes
// countTokens) is not a dependency. An API path would break local-auth users and
// add a dep for a dev-only harness. What length control actually needs is a
// *consistent* measure applied identically to both arms, not exact model tokens —
// so we record exact chars and words (no approximation) plus a documented
// estTokens heuristic. If a more accurate tokenizer is wired up later, chars and
// words are preserved so historical runs can be re-derived without re-running.

export type LengthMeasure = {
  chars: number;      // exact character count of the judged text
  words: number;      // exact whitespace-delimited word count
  estTokens: number;  // estimate: chars / 4 (standard English BPE approximation)
};

export function measure(text: string): LengthMeasure {
  const chars = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const estTokens = Math.round(chars / 4);
  return { chars, words, estTokens };
}
