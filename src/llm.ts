// Thin wrapper around the Claude Agent SDK's `query` function.
// We use it as a stateless one-shot: each call gets a fresh session
// with a tight system prompt and the user's problem framing.
//
// Each divergent branch is its own query() call so they run in true
// parallel — this is the "ADHD" fan-out. Branches don't see each other's
// output during divergence (mixing kills idea quality).

import { query } from "@anthropic-ai/claude-agent-sdk";
import type { CallUsage } from "./types.js";

export type LLMOptions = {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  // Optional side-channel: invoked once with the call's token/cost usage when
  // the SDK reports it. Passive instrumentation — does not affect the output.
  onUsage?: (u: CallUsage) => void;
};

export function emptyUsage(): CallUsage {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
    costUSD: 0,
  };
}

export function addUsage(a: CallUsage, b: CallUsage): CallUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadInputTokens: a.cacheReadInputTokens + b.cacheReadInputTokens,
    cacheCreationInputTokens: a.cacheCreationInputTokens + b.cacheCreationInputTokens,
    costUSD: a.costUSD + b.costUSD,
  };
}

export async function callLLM(opts: LLMOptions): Promise<string> {
  const chunks: string[] = [];

  const iter = query({
    prompt: opts.userPrompt,
    options: {
      model: opts.model,
      systemPrompt: { type: "preset", preset: "claude_code", append: opts.systemPrompt },
      // No tools — divergence is pure generation. Tools = convergence pressure.
      allowedTools: [],
      permissionMode: "bypassPermissions",
    },
  });

  for await (const message of iter) {
    if (message.type === "assistant") {
      for (const block of message.message.content) {
        if (block.type === "text") chunks.push(block.text);
      }
    }
    if (message.type === "result") {
      if (message.subtype !== "success") {
        throw new Error(`LLM call failed: ${message.subtype}`);
      }
      const u = message.usage;
      opts.onUsage?.({
        inputTokens: u.input_tokens ?? 0,
        outputTokens: u.output_tokens ?? 0,
        cacheReadInputTokens: u.cache_read_input_tokens ?? 0,
        cacheCreationInputTokens: u.cache_creation_input_tokens ?? 0,
        costUSD: message.total_cost_usd ?? 0,
      });
    }
  }

  return chunks.join("").trim();
}

// Strip ```json fences and parse. LLMs love to wrap.
export function parseJSON<T>(raw: string): T {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  // Find the first { or [ — sometimes there's a preamble despite instructions.
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
      ? firstObj
      : Math.min(firstObj, firstArr);
  if (start > 0) s = s.slice(start);
  return JSON.parse(s) as T;
}
