# Work Log

A running, chronological session log — what happened and why, for picking
up context between sessions. Newest entry on top. This is working memory,
not user-facing release notes (that'd be a CHANGELOG); keep entries short
and skip anything derivable from `git log`. For durable "why the system is
shaped this way" reasoning, see `docs/` instead — this file is for "what
changed recently."

Entry format:

```
## YYYY-MM-DD — short session focus

**What changed**
- ...

**Why**
- ...

**Follow-ups / open threads**
- ...
```

---

## 2026-09-13 — Claude Code project tooling: agents, hooks, docs

**What changed**
- Added `.claude/` scaffold: `settings.json`, `agents/` (locator, api-route-
  agent, ui-component-agent, domain-logic-agent), `commands/`, `skills/`
  (`start-dev`).
- Added a Husky `pre-push` hook gating pushes on `npm run typecheck`.
- Documented a subagent delegation policy in `CLAUDE.md` (route by file
  path; no catch-all "coding agent," no standing "orchestrator" agent).
- Added `docs/` (architecture.md + decisions/ ADR-lite folder) and this
  `WORKLOG.md`, plus a `SessionEnd` hook that nudges (and best-effort
  blocks) session close until a worklog entry exists for the session.

**Why**
- Repo had zero automation (no CI, no hooks, no lint/tests) and no
  project-specific Claude Code config — this was the first pass at both,
  scoped to what the repo actually needs rather than a generic template.
- Subagent roster is model-tiered on purpose: cheap lookups pinned to
  Haiku, reasoning-heavy work left to inherit whichever model (Sonnet/
  Opus) is driving the session — see `docs/decisions/` for the reasoning
  as it gets written up in more detail.

**Follow-ups / open threads**
- No lint config or test framework exists yet — pre-push only gates on
  typecheck. Revisit if/when either gets added.
- `SessionEnd` hook blocking behavior is unconfirmed by docs — first real
  `/clear` after this lands should confirm whether it actually blocks or
  only best-effort stubs the entry.
- `CLAUDE.md`'s "five core collections" line is stale — `models.ts`
  actually has six (`PermitDocument` added for the CA compliance suite).
  Worth fixing next time that file is touched.
