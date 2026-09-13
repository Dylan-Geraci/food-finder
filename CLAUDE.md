# CLAUDE.md

Guidance for working in this repository. **HomePlate** (package name `homeplate`)
is a hyper-local, home-cooked-meal marketplace MVP built on Next.js 15.

---

## Git attribution — STRICT

All git work in this repo must be attributed to **Dylan Geraci's** GitHub account
(`Dylan-Geraci`) — never to Claude, Anthropic, or any bot identity.

- Commits must use Dylan's own configured git identity as **both author and committer**.
  Do not override author/committer to a Claude/Anthropic/bot identity.
- **Never** add a `Co-Authored-By: Claude ...` trailer (or any `@anthropic.com` /
  `noreply@anthropic.com` address). GitHub counts co-authors as contributors.
- **Never** add "Generated with Claude Code", "🤖", or any similar self-attribution
  to commit messages, PR titles, or PR descriptions.
- Only run `git add`, `git commit`, or `git push` when explicitly asked to. When you
  do, the above rules apply with no exceptions.

Before committing, sanity-check the identity:

```bash
git config user.name    # → Dylan Geraci
git config user.email   # → dylangeraci.dev@gmail.com
```

---

## Running the project

Requirements: **Node.js 18+** and npm. No database install required.

```bash
npm install
npm run dev        # → http://localhost:3000  (Next.js dev server, hot reload)
```

On the **first API request** the app auto-boots an embedded local MongoDB
(`mongodb-memory-server`), persists its data files under `db/data/`, and auto-seeds
from `db/mock-data.json`. The very first boot downloads a local `mongod` binary to
`db/mongodb-binaries/` (one-time, ~1–2 min). If port 3000 is taken, Next.js picks the
next free port and prints the URL.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (auto-boots + auto-seeds the DB) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run seed` | **Reset** the DB and repopulate from `db/mock-data.json`. Stop the dev server first — the embedded DB allows only one process at a time. |
| `npm run typecheck` | `tsc --noEmit` type check |

### Configuration

Copy `.env.example` → `.env.local`. **All variables are optional** — with none set,
the app runs fully on the embedded DB with mock email auth.

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | *(unset → embedded local MongoDB)* | Point at your own `mongod` / Atlas instance |
| `MONGODB_DB` | `fablefile` | Database name |
| `AUTH_SECRET` | *(unset)* | NextAuth session secret (`npx auth secret`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | *(unset → button disabled)* | Google OAuth client |
| `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET` | *(unset → button disabled)* | Sign in with Apple |
| `HOMEPLATE_ADMIN_EMAILS` | *(unset → review queue open in dev)* | Comma-separated emails allowed to use `/admin/permits` |

`.env.local` is gitignored — never commit real secrets. No secrets are hardcoded; all
config is read from `process.env`.

---

## Tech stack

- **Next.js 15** (App Router, TypeScript, React 19, Tailwind CSS 4, Lucide icons).
- **MongoDB + Mongoose** — embedded local instance via `mongodb-memory-server`
  (persisted to `db/data/`); swap to any real MongoDB/Atlas URI via `MONGODB_URI`.
- **MapLibre GL + OpenFreeMap tiles** — free/open-source mapping, no API key.
- **NextAuth v5 (Auth.js)** — OAuth scaffolding at `/api/auth/[...nextauth]`,
  coexisting with the explicit mock `/api/auth/login` + `/api/auth/signup` routes.

The logic layer (`src/services/`, `src/hooks/`) is deliberately framework-agnostic so
it can port to React Native/Expo or a Capacitor wrapper without a rewrite.

---

## Project structure

```
├── src/
│   ├── app/          # App Router routes + /api/* handlers
│   │   ├── page.tsx              # / landing (marketplace home)
│   │   ├── map/                  # /map
│   │   ├── cooks/[id]/           # kitchen page
│   │   ├── profile/             # /profile, /profile/user, /profile/business, /profile/settings
│   │   └── api/                  # meals, cooks, users, reviews, orders, auth
│   ├── components/   # Navbar, MealCard, CookCard, QuickViewSheet, MapView, RatingStars,
│   │                 # Avatar, ReviewForm/List, BottomNav, OrderModal, MealForm, AuthModal, …
│   ├── context/      # AuthContext (mock session: guest/diner/cook), OrderContext
│   ├── hooks/        # useGeoLocation, useFetch, useCooks
│   └── services/     # db.ts, models.ts, rating.ts, geo.ts, seed.ts, oauth.ts,
│                     # password.ts, password-rules.ts, session.ts, media.ts, market.ts
├── db/               # mock-data.json, seed.mjs, data/ (DB files), mongodb-binaries/
└── README.md
```

Key service modules:
- `services/models.ts` — the five Mongoose schemas (see below).
- `services/rating.ts` — pure 1.0–5.0 star math: clamped input, guarded averages
  (**0 reviews → `0.0`, never `NaN`**, shown as "New"), rounding, distribution histograms.
- `services/db.ts` — connection + embedded-DB bootstrap.
- `services/seed.ts` / `db/seed.mjs` — seeding logic.

---

## Data schema (`src/services/models.ts`)

Five core collections, all via Mongoose. Ratings are **denormalized** onto meals and
cook profiles and recomputed on every `POST /api/reviews`.

**User** — a diner or cook account.
- `key` (unique slug), `name`, `email` (unique), `passwordHash` (`"scrypt:<salt>:<hash>"`;
  empty = passwordless demo), `role` (`"diner" | "cook"`), `addresses[]`
  (`{ label, line1, city, isDefault }`), `favoriteCookIds[]` (→ CookProfile), `joinedAt`.
  Timestamped.

**CookProfile** — a kitchen; one per cook User (`userId` unique).
- `kitchenName`, `bio`, `portrait`, `banner`, `icon`,
  `location` (`{ lat, lng, label }`), `cuisines[]`.
- `operatingHours[]` — weekly "General Hours" (`{ day "Mon".."Sun", open "HH:MM", close, closed }`).
- `hoursExceptions[]` — date overrides (`{ date "YYYY-MM-DD", closed, open, close, note }`).
- `ratingAvg`, `ratingCount` — denormalized aggregates. Timestamped.

**Meal** — a dish offered by a kitchen.
- `key` (unique), `cookId` (→ CookProfile), `title`, `description`, `price` (≥0),
  `prepMinutes`, `image` (primary photo = `photos[0]`), `photos[]` (**max 2**), `tags[]`,
  `servingsLeft`, `available`, `ratingAvg`, `ratingCount`. Timestamped.

**Review** — a 1.0–5.0 star rating on a meal.
- `mealId` (→ Meal), `cookId` (→ CookProfile), `dinerId` (→ User),
  `stars` (1.0–5.0), `comment`, `createdAt`.

**Order** — a diner's order from a kitchen.
- `dinerId`, `cookId`, `mealId`, `qty` (≥1), `priceEach`, `total`,
  `type` (`"pickup" | "delivery"`), `note`,
  `status` (`ORDER_STATUSES`: `pending → accepted → ready → completed`, or `cancelled`),
  `placedAt`.

---

## API surface

| Endpoint | Description |
|---|---|
| `GET /api/meals` | All meals joined with kitchen + location |
| `POST /api/meals` · `PATCH /api/meals/:id` · `DELETE /api/meals/:id` | Kitchen listing management |
| `GET /api/cooks` | Cook profiles with rating aggregates + active meal counts |
| `GET /api/cooks/:id` | Full kitchen page: profile, menu, reviews |
| `GET /api/users` | Seeded users (mock-auth account switcher) |
| `POST /api/users/favorites` | Toggle a diner's saved kitchens |
| `GET /api/reviews?dinerKey=\|cookId=` | Review history / kitchen analytics feed |
| `POST /api/reviews` | `{ mealId, dinerKey, stars, comment }` → validates 1.0–5.0, recomputes averages |
| `GET /api/orders?dinerKey=\|cookId=` | Order history / kitchen queue |
| `PATCH /api/orders/:id` | Queue transitions (pending → accepted → ready → completed / cancelled) |
| `POST /api/auth/login` · `POST /api/auth/signup` | Mock email-lookup login; signup persists Users (+ CookProfile for kitchens) |
| `/api/auth/[...nextauth]` | NextAuth v5 OAuth (Google / Apple), gated by env vars |
| `POST /api/cooks/:id/permit-document` · `GET` | Submit a permit photo for human verification / recent submissions |
| `GET /api/admin/permits` · `PATCH /api/admin/permits/:id` | Operator review queue (`/admin/permits` UI); approve = only path to `permitStatus: "verified"`. Gated by `HOMEPLATE_ADMIN_EMAILS` when set |

---

## Delegating to subagents

`.claude/agents/` defines four subagents (`locator`, `api-route-agent`,
`ui-component-agent`, `domain-logic-agent`) — see `.claude/agents/README.md`
for the full model/tooling rationale. Ownership is by file path, not by
task description:

| If the work touches... | Delegate to |
|---|---|
| `src/app/api/**/route.ts` | `api-route-agent` |
| `src/components/**`, `src/app/**/*.tsx` (pages) | `ui-component-agent` |
| `src/services/**` (models, compliance, rating, auth, seeding) | `domain-logic-agent` |
| A pure lookup — "where is X," "find usages of Y" — before any of the above | `locator` |
| Anything outside those paths (config, `db/seed.mjs`, `.husky/`, docs) | the built-in `general-purpose` agent type — no dedicated file for this on purpose, see below |

Rules:
- **Route by file path, not vibes.** If a task is "add an endpoint that
  changes a Mongoose schema," that's two delegations (`domain-logic-agent`
  for the schema, `api-route-agent` for the route), not one agent doing
  both off-scope.
- **Lookups go through `locator` first.** It's pinned to `haiku` — using it
  for pure search before reasoning is the actual mechanism that saves
  tokens; skipping it and re-grepping at full price in a bigger agent
  defeats the point.
- **No dedicated catch-all "coding agent."** Deliberately not added — a
  generic agent becomes a dumping ground that ambiguous work gets routed to
  out of convenience, which erodes the specialization (domain guardrails,
  token tiering) the scoped agents exist for. The rare truly-uncategorized
  edit (config, seed script, the pre-push hook itself) is infrequent enough
  that the built-in `general-purpose` type handles it without a bespoke
  file.
- **No dedicated "orchestrator" agent.** Subagents don't spawn further
  subagents — the orchestrator is whichever model (Sonnet/Opus) is driving
  the current session. It reads this table and delegates directly. For a
  genuinely multi-stage, deterministic pipeline, use the `Workflow` tool
  explicitly rather than reaching for a standing orchestrator agent.

---

## Conventions

- UI uses **Lucide SVG icons** throughout — no emoji.
- Meal imagery is served from curated Unsplash URLs stored in the mock data.
- Run `npm run typecheck` before considering a change done.
