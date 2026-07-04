# FableFare 🍲

A hyper-local marketplace for **home-cooked meals** — a dedicated space for
neighborhood cooks and hungry diners, without the clutter of generalized
marketplaces.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:3000
```

That's it. **No database install required**: on first API request the app
boots an embedded local MongoDB (`mongodb-memory-server`) whose data files
persist under `db/data/`, then auto-seeds it with mock users, cooks, meals,
and historical reviews. The first boot downloads a local `mongod` binary to
`db/mongodb-binaries/` (one-time, ~1–2 min).

> If port 3000 is occupied, Next.js automatically picks the next free port
> and prints the exact URL in the terminal.

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 15** (App Router, TypeScript, Tailwind CSS 4, Lucide icons, Inter) | Full-width responsive marketplace UI (1-4 column grid, mobile bottom tabs); logic layer (`services/`, `hooks/`) is framework-agnostic and ports to React Native/Expo or a Capacitor wrapper without rewrite |
| Database | **MongoDB** (embedded local instance via `mongodb-memory-server`, persisted to `db/data`) + Mongoose | Zero-install local dev; swap to any real MongoDB/Atlas URI via env var |
| Mapping | **MapLibre GL + OpenFreeMap tiles** | Fully free and open-source — no API key, no Google Maps, no Mapbox |

## Configuration

Copy `.env.example` → `.env.local`. All variables are optional:

| Variable | Default | Purpose |
|---|---|---|
| `MONGODB_URI` | *(unset → embedded local MongoDB)* | Point at your own `mongod` or hosted instance |
| `MONGODB_DB` | `fablefile` | Database name |

No secrets are hardcoded anywhere; config is read from `process.env`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload (auto-boots + auto-seeds the DB) |
| `npm run seed` | **Reset** the database and repopulate from `db/mock-data.json` (stop the dev server first — the embedded DB allows one process at a time) |
| `npm run build` / `start` | Production build / serve |
| `npm run typecheck` | TypeScript check |

## Project structure

```
├── src/
│   ├── components/   # Navbar, MealCard, CookCard, QuickViewSheet, MapView (OpenFreeMap),
│   │                 # RatingStars, Avatar (monogram), ReviewForm/List, BottomNav (mobile)
│   ├── context/      # UserContext — mock auth session (switch diner/cook accounts)
│   ├── hooks/        # useGeoLocation (browser geo w/ fallback), useFetch
│   ├── app/          # Routes: / (landing), /map, /cooks/[id], /profile + /api/*
│   └── services/     # db.ts, models.ts, rating.ts, geo.ts, seed.ts — framework-agnostic
├── db/               # mock-data.json, seed.mjs, data/ (DB files), mongodb-binaries/
└── README.md
```

Meal imagery is served from curated Unsplash photography URLs stored in the
mock data (each verified at build time). The UI uses Lucide SVG iconography
throughout — no emoji.

## Core modules

- **Landing page** — UberEats-style marketplace home: hero with address
  search and market stats, sticky cuisine filter rail, responsive meal grid
  (hover transitions, price tags, dietary labels, cook times), a horizontal
  kitchens rail, and an embedded auto-populated neighborhood map. Meal and
  kitchen cards open a **Quick View** sheet (right panel on desktop, bottom
  drawer on mobile) with the cook's profile, certifications, and menu.
- **Auth &amp; dual profiles** — three session states (guest / Diner / Business)
  managed by `src/context/AuthContext.tsx`. Guests get Log In / Sign Up
  entries in the navbar and hero (modal with account-type selection); login
  is a mock email lookup, signup writes real records (kitchen accounts get a
  CookProfile and appear on the map instantly). `/profile` routes each role
  to its own dashboard: `/profile/user` (order history, saved kitchens,
  addresses, review center) and `/profile/business` (incoming order queue
  with status transitions, meal listing CRUD, operating hours, certification
  status, and a 1.0-5.0 rating distribution analytics panel).
- **Profiles** — every user is a `diner` or `cook`; cooks get a `CookProfile`
  with kitchen name, bio, geo location, cuisines, and food-safety
  certification placeholders. The Profile tab switches between seeded
  accounts (mock auth).
- **Rating engine** (`src/services/rating.ts`) — pure float math for 1.0–5.0
  star reviews: clamped input, guarded averages (**0 reviews → `0.0`, never
  `NaN`** — displayed as "New"), display rounding, and distribution
  histograms. Aggregates are denormalized onto meals and cook profiles and
  recomputed on every `POST /api/reviews`.
- **Map** (`src/components/MapView.tsx`) — MapLibre GL with OpenFreeMap's
  `liberty` style; custom rating-pill markers per active cook, popups linking
  to kitchen pages, and a blue dot for your own position (with graceful
  fallback to the mock city center when location is denied).
- **Seeding** — `db/mock-data.json` holds 10 users, 6 kitchens (one brand-new
  with zero reviews to exercise the edge case), 11 meals, and 18 historical
  reviews across Orange County and Los Angeles, CA. Auto-seeds on first
  boot; `npm run seed` resets.

## API

| Endpoint | Description |
|---|---|
| `GET /api/meals` | All meals joined with kitchen + location |
| `GET /api/cooks` | All cook profiles with rating aggregates + active meal counts |
| `GET /api/cooks/:id` | Full kitchen page: profile, menu, reviews |
| `GET /api/users` | Seeded users (mock-auth account switcher) |
| `GET /api/reviews?dinerKey=\|cookId=` | Review history / kitchen analytics feed |
| `POST /api/reviews` | `{ mealId, dinerKey, stars, comment }` → validates 1.0–5.0, recomputes meal + cook averages |
| `POST /api/auth/login` / `signup` | Mock email-lookup login; signup persists Users (+ CookProfile for kitchens) |
| `GET /api/orders?dinerKey=\|cookId=` | Order history / kitchen queue |
| `PATCH /api/orders/:id` | Queue transitions: pending → accepted → ready → completed (or cancelled) |
| `POST /api/meals` / `PATCH /api/meals/:id` / `DELETE` | Kitchen listing management |
| `POST /api/users/favorites` | Toggle a diner's saved kitchens |

## Path to mobile

The mobile transition is designed in, not bolted on: all business logic
(`services/rating.ts`, `services/geo.ts`), data contracts, and the REST API
are UI-framework-agnostic. The web UI is a single-column, bottom-tab layout
that maps 1:1 to native navigation patterns. Porting means reimplementing the
thin view layer in React Native (MapLibre has a native RN binding:
`@maplibre/maplibre-react-native`) while keeping services, API routes, and
the database untouched.
