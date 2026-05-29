# Install

[← back to README](../README.md)

ADHD ships three ways: as an **agent skill** (works in Claude Code, Cursor, Antigravity, Codex, and ~50 more), as a **CLI**, and as a **Node/TS library**.

## One command, every agent

```bash
npx skills add UditAkhourii/adhd
```

The [`skills`](https://github.com/vercel-labs/skills) CLI detects which agent you are using and drops [`skills/adhd/SKILL.md`](../skills/adhd/SKILL.md) into the right place. Supports **Claude Code, Claude.ai, Antigravity, Cursor, Codex, Cline, Continue, Aider, Gemini CLI, Windsurf, Cody, Roo, Augment, OpenCode, Kilo, Kimi, Qwen, Trae, Replit, Warp**, and ~40 more.

Restart your agent. The skill auto-triggers on brainstorm, ideate, design, naming, refactor, and "give me a few ways to" intents. Or invoke it explicitly: `/adhd "design a rate limiter that survives a leader election"`.

Useful flags:

```bash
npx skills add UditAkhourii/adhd -g            # install globally instead of per-project
npx skills add UditAkhourii/adhd -a claude-code -a cursor   # target specific agents
npx skills add UditAkhourii/adhd --copy        # copy files instead of symlinking
npx skills add UditAkhourii/adhd --list        # see what skills the repo offers
```

## Manual install (if you do not have npx)

The skill file is at [`skills/adhd/SKILL.md`](../skills/adhd/SKILL.md). Curl it into your agent's skill directory:

```bash
# Claude Code (global)
mkdir -p ~/.claude/skills/adhd
curl -fsSL https://raw.githubusercontent.com/UditAkhourii/adhd/main/skills/adhd/SKILL.md \
  -o ~/.claude/skills/adhd/SKILL.md

# Claude Code (per-project)
mkdir -p .claude/skills/adhd
curl -fsSL https://raw.githubusercontent.com/UditAkhourii/adhd/main/skills/adhd/SKILL.md \
  -o .claude/skills/adhd/SKILL.md

# Cursor (project rules)
curl -fsSL https://raw.githubusercontent.com/UditAkhourii/adhd/main/skills/adhd/SKILL.md >> .cursorrules
```

For **Claude.ai web/desktop**: open project settings → **Skills** → **Add skill** → upload [`skills/adhd/SKILL.md`](../skills/adhd/SKILL.md).

For **Cline, Continue, Aider, Roo Code, and other agents**: paste the body of [`SKILL.md`](../skills/adhd/SKILL.md) (skip the YAML frontmatter) into your agent's system prompt or rules field.

## Programmatic install (Agent SDK)

```ts
import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync } from "node:fs";

const skill = readFileSync("./skills/adhd/SKILL.md", "utf8");

for await (const m of query({
  prompt: "design a retry strategy for a CLI whose LLM hangs for 90s",
  options: {
    systemPrompt: { type: "preset", preset: "claude_code", append: skill },
    allowedTools: ["Task"],
  },
})) {
  // …
}
```

## As a CLI (terminal usage, no agent needed)

```bash
npm install -g adhd-agent
adhd "design a rate limiter that survives a leader election"
```

Auth: picks up `ANTHROPIC_API_KEY` from the environment, or inherits auth from a local Claude Code install.

## As a library (inside your own agent)

```bash
npm install adhd-agent
```

```ts
import { run } from "adhd-agent";
const result = await run({ problem: "...", framesPerRun: 5, topK: 3 });
```

See [api.md](./api.md) for the full library and CLI reference.

## From source

```bash
git clone https://github.com/UditAkhourii/adhd.git
cd adhd && npm install && npm run build
```
