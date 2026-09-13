# docs/

Durable "why" documentation for HomePlate — things you'd want to refer back
to months from now, not things that change every session.

- `architecture.md` — system overview: how the pieces fit together and why
  they were chosen (embedded DB, mock auth alongside real OAuth scaffolding,
  denormalized ratings, etc.).
- `decisions/` — one file per notable decision (ADR-lite: context, decision,
  consequences), for choices narrower than the whole-system overview but
  still worth a paper trail — e.g. "why MapLibre over Google Maps."

This is distinct from root `WORKLOG.md`, which is a running, chronological
session log ("what happened, session by session") — short-lived working
memory, not durable reasoning. Look here for *why the system is shaped this
way*; look at `WORKLOG.md` for *what changed recently and why*.
