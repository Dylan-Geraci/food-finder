# .claude/

Project-level Claude Code configuration for HomePlate. This directory is
committed and shared — everyone who clones the repo gets the same setup.

- `settings.json` — shared permissions/hooks config. Personal overrides go in
  a gitignored `settings.local.json` instead of editing this file.
- `agents/` — custom subagent definitions. See `agents/README.md`.
- `commands/` — custom slash commands. See `commands/README.md`.
- `skills/` — project-specific skills. See `skills/README.md`.

Top-level `CLAUDE.md` (repo root, not in here) is the always-loaded project
context file — leave it where it is.
