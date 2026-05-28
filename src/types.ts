export type Idea = {
  id: string;
  frameId: string;
  cluster?: string;
  text: string;        // one-line phrase, not a paragraph
  rationale?: string;  // optional, short
  score?: Score;
  depth: number;       // 0 = root divergence, 1+ = deepened
  parentId?: string;
};

export type Score = {
  novelty: number;     // 0-10, away from the obvious
  viability: number;   // 0-10, could actually ship
  fit: number;         // 0-10, addresses the stated problem
  total: number;       // weighted
  trap?: string;       // if it looks good but is a trap, why
};

export type Branch = {
  frameId: string;
  ideas: Idea[];
};

// Token/cost accounting from the SDK, summed across every LLM call in a run.
// Reported by the eval (cost is one of the four wins) and reusable for a budget
// cap later. Cache fields are tracked because prompt caching (task 2.1) will
// move tokens from input into the cache columns.
export type CallUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheCreationInputTokens: number;
  costUSD: number;
};

export type RunResult = {
  problem: string;
  reframe?: string;
  branches: Branch[];        // raw divergence per frame
  clusters: Cluster[];        // converged shape of the space
  shortlist: Idea[];          // 2-4 most promising
  nonObviousPick: Idea | null;
  traps: Idea[];
  deepened: DeepenedIdea[];   // top branches expanded
  provocation: string;        // single wild-card question/idea
  usage: CallUsage;           // summed token/cost accounting for the whole run
};

export type Cluster = {
  label: string;
  ideaIds: string[];
};

export type DeepenedIdea = {
  ideaId: string;
  sketch: string;       // 4-8 sentences: how it works, key risk, first step
  childIdeas: Idea[];   // sub-ideas surfaced while deepening
};

export type RunOptions = {
  problem: string;
  context?: string;                    // codebase snippets, constraints, stack
  framesPerRun?: number;               // default 5
  ideasPerFrame?: number;              // default 6
  topK?: number;                       // how many to deepen, default 3
  concurrency?: number;                // parallel branches, default 4
  codeMode?: boolean;                  // bias frames toward engineering
  model?: string;                      // override SDK model
  onEvent?: (e: RunEvent) => void;     // stream progress to caller/CLI
};

export type RunEvent =
  | { kind: "frame:start"; frameId: string; frameLabel: string }
  | { kind: "frame:done"; frameId: string; count: number }
  | { kind: "score:done"; total: number }
  | { kind: "cluster:done"; clusters: number }
  | { kind: "deepen:start"; ideaId: string; text: string }
  | { kind: "deepen:done"; ideaId: string }
  | { kind: "warn"; message: string };
