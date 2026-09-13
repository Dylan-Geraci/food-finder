# agents/

Custom subagent definitions, invoked via the Agent tool's `subagent_type`.

| Agent | Model | Scope |
|---|---|---|
| `locator` | pinned `haiku` | Read-only lookups — "where is X," "find usages of Y." Grep/Glob/Read only. |
| `api-route-agent` | inherits session model | `src/app/api/**/route.ts` — CRUD handler work. |
| `ui-component-agent` | inherits session model | `src/components/**`, `src/app/**/*.tsx` — UI work. |
| `domain-logic-agent` | inherits session model, never haiku | `src/services/**` — schemas, compliance, rating, auth. |

Design principle: `model` is pinned to `haiku` only on agents doing pure
mechanical lookup with no judgment calls. Every other agent omits `model`
so it inherits whichever model (Sonnet, Opus, …) is driving the current
session — switching your main driver upgrades/downgrades these agents with
it, no per-agent editing needed. Route pure lookups through `locator` first
to actually capture the token savings instead of re-grepping at full price.

## File format

Each agent is a Markdown file with YAML frontmatter:

```markdown
---
name: schema-reviewer
description: >
  One-line-to-a-few-lines summary of what this agent does and, critically,
  when to use it vs. the other agents in this folder.
tools: Read, Grep, Glob   # optional allowlist; omit for full tool access
model: haiku              # optional; omit to inherit the session model
---

System prompt / instructions for the agent go here.
```

- `name` — how it's referenced as `subagent_type`.
- `description` — shown in the agent picker; be specific about when to use it.
- `tools` — optional allowlist; omit for full tool access.
- `model` — optional override (`sonnet`, `opus`, `haiku`); omit to inherit.
