# 1. Embedded MongoDB for local development

## Context

The project needs a database for five-to-six related collections (users,
cook profiles, meals, reviews, orders, permit documents) with real
relational queries (joins by ID, aggregation for ratings). Local dev setup
friction directly affects how often the project gets worked on — every
external dependency (installed DB server, Docker, a cloud account) is a
chance for "clone and run" to fail on a new machine.

## Decision

Use `mongodb-memory-server` to auto-boot a local, file-persisted MongoDB
instance on the first API request when `MONGODB_URI` is unset
(`src/services/db.ts`). Persist its data under `db/data/` (gitignored) and
auto-seed from `db/mock-data.json` on first boot. A real `MONGODB_URI`
(Atlas or self-hosted) transparently overrides this — no code change
required, just an env var.

## Consequences

- `npm install && npm run dev` works with zero external setup, which is
  the point.
- The embedded instance is **single-process**: `npm run seed` (which
  resets the DB) cannot run concurrently with `npm run dev`. Documented in
  `CLAUDE.md` and `.claude/skills/start-dev/SKILL.md`, but easy to forget —
  if dev-server file-watch churn or seed script errors show up, check
  whether two processes are fighting over the same embedded DB first.
- First-ever boot on a machine downloads a `mongod` binary to
  `db/mongodb-binaries/` (one-time, ~1–2 min) — not a hang, just slow.
- This only defers the "real database" decision, it doesn't avoid it —
  production deployment still needs a real `MONGODB_URI` pointed at an
  actual MongoDB instance.
