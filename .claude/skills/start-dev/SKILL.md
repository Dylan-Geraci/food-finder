---
name: start-dev
description: >
  Launch the HomePlate Next.js dev server and verify it actually works
  (embedded DB boots + seeds, API responds) rather than just confirming the
  process started. Use whenever asked to run, start, or spin up the project
  locally — this is the project-specific launch procedure, more precise
  than the generic "run" skill's fallback patterns for this repo.
---

Launching means the server is up **and** the embedded database has booted
and seeded — not just that `next dev` printed "Ready." Follow these steps
in order.

## 0. Check if it's already running

Before starting anything, check whether a dev server is already listening
on port 3000 (or nearby, since Next.js picks the next free port). If a
`npm run dev` background task from an earlier point in this session is
still alive, don't start a second one — Next.js will just pick a different
port and you'll end up with two servers. Reuse the existing one.

## 1. Install dependencies if needed

```bash
test -d node_modules || npm install
```

## 2. Start the dev server in the background

```bash
npm run dev
```

Run this as a background task (not foreground — it never exits). Do not
run `npm run seed` at any point while this is up: the embedded DB
(`mongodb-memory-server`) allows only one process at a time, and `seed`
resets the whole database.

## 3. Wait for it to report ready

Poll the background task's output file for Next.js's ready line rather
than guessing a fixed sleep:

```bash
until grep -qE "Ready in|EADDRINUSE|Error" <output-file>; do sleep 1; done
tail -n 20 <output-file>
```

Note the actual port from the output (`Local: http://localhost:PORT`) —
it may not be 3000 if that port was taken.

On a first-ever boot in this repo, the app also downloads a local `mongod`
binary to `db/mongodb-binaries/` — one-time, roughly 1–2 minutes. Don't
treat a slow first boot as a hang; give it a longer timeout than usual the
very first time.

## 4. Verify it actually works, not just that it started

"Ready in Xs" only means Next.js compiled — it says nothing about the
database. Hit an API route to force the embedded DB to boot and auto-seed,
and confirm real data comes back:

```bash
curl -s -o /tmp/smoke.json -w "HTTP %{http_code}\n" http://localhost:PORT/api/meals --max-time 60
```

Expect `HTTP 200` and a non-empty `meals` array in the response body. If
this fails or times out, the dev server "started" but the app isn't
actually usable — report that distinction, don't call it done on the
Next.js ready line alone.

## 5. Report back

Give the user the working URL and confirm both checks passed (server ready
+ API smoke test), not just that the process launched.
