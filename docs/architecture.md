# Architecture

HomePlate is a hyper-local, home-cooked-meal marketplace MVP: diners
discover nearby home cooks, browse meals, order for pickup/delivery, and
review. This doc explains the shape of the system and *why* it's shaped
that way — see root `CLAUDE.md` for the up-to-date factual reference (data
schema, API surface, scripts).

## Layering

```
src/app/            Next.js App Router — pages + API routes
src/components/      UI, framework-coupled
src/context/         Client-side global state (Auth, Order)
src/hooks/           Thin data-fetch / geo hooks
src/services/        Framework-agnostic domain logic + Mongoose models
```

**Why services/ is framework-agnostic:** the domain logic (rating math,
geo distance, compliance rules, password hashing) doesn't import
Next.js-specific APIs. This is deliberate — the goal is to be able to port
the client to React Native/Expo or wrap it in Capacitor without rewriting
business logic, only the UI layer.

## Data layer: embedded MongoDB by default

`services/db.ts` boots a local `mongodb-memory-server` instance on the
first API request if `MONGODB_URI` isn't set, persisting to `db/data/`.

**Why:** zero-setup local dev — `npm install && npm run dev` works with no
external service, no Docker, no Atlas account. Swapping in a real MongoDB
is a one-line env var (`MONGODB_URI`) when the project needs multi-instance
or production persistence; nothing in the app code changes.

**Consequence to remember:** the embedded DB is single-process. Running
`npm run seed` while `npm run dev` is up will conflict — always stop the
dev server first (see `db/seed.mjs`, `CLAUDE.md`).

## Ratings: denormalized, recomputed on write

`Meal.ratingAvg`/`ratingCount` and `CookProfile.ratingAvg`/`ratingCount`
are stored redundantly rather than computed on read, and recomputed by
`services/rating.ts` inside `POST /api/reviews`.

**Why:** meal/cook listings are read far more often than reviews are
written — denormalizing avoids an aggregation query on every listing page
load. `rating.ts` guards the empty case explicitly (0 reviews → `0.0`,
rendered as "New", never `NaN`) since that's the state most new listings
start in.

## Auth: mock email-lookup alongside real OAuth scaffolding

`POST /api/auth/login` / `signup` implement a simple mock/demo auth flow
(email lookup, optional password) that works with zero configuration.
`/api/auth/[...nextauth]` wires up NextAuth v5 (Google/Apple) but only
activates when the corresponding env vars are set.

**Why:** lets the marketplace UX be fully demoable (switch between seeded
accounts, no OAuth app registration needed) while the real-auth path is
already scaffolded for when the project needs it — not a placeholder to be
built later, but dormant until configured.

## Maps: MapLibre GL + OpenFreeMap

No Google Maps API key, no billing account needed for local dev or for
running the map view at all.

**Why:** keeps the MVP's cost and setup surface at zero. Revisit only if a
feature needs data OpenFreeMap doesn't provide (e.g. richer geocoding).

## Compliance suite (`services/compliance.ts`, `ComplianceTracker.tsx`)

Encodes California MEHKO / Cottage Food statutory caps (revenue limits,
permit requirements) and tracks a cook's permit verification status
end-to-end: submission (`POST /api/cooks/:id/permit-document`) → human
review queue (`/admin/permits`, gated by `HOMEPLATE_ADMIN_EMAILS`) →
`permitStatus: "verified"`.

**Why it's a separate, dense module:** these are legal/statutory values,
not product opinions — they shouldn't be casually edited alongside
unrelated feature work. See `docs/decisions/` for specific calls made here
as they accumulate.
