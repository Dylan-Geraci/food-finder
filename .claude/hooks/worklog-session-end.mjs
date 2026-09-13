#!/usr/bin/env node
// SessionEnd hook: if this session made real changes (tracked by the
// PostToolUse activity hook) but never logged them in WORKLOG.md, drop a
// placeholder entry and try to block the close so Claude replaces it with
// a real summary. A session with no Write/Edit activity at all (pure Q&A,
// read-only exploration) is left alone entirely — nothing to log.
// Exact blocking support for SessionEnd is unconfirmed by the settings
// schema docs (only PostToolUse/Stop/UserPromptSubmit are explicitly
// documented as honoring `decision: "block"`) — this is deliberately
// best-effort: even if the block isn't honored, the stub itself is written
// first, so a closed session still leaves a breadcrumb.
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";

function main() {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return;
  }

  const cwd = input?.cwd || process.cwd();
  const sessionId = input?.session_id || "unknown-session";
  const stateDir = join(cwd, ".claude", "state");
  const activityPath = join(stateDir, `${sessionId}.activity`);
  const sentinelPath = join(stateDir, `${sessionId}.worklog-written`);

  if (!existsSync(activityPath)) return; // nothing meaningful happened — don't nag
  if (existsSync(sentinelPath)) return; // real entry already written, nothing to do

  const worklogPath = join(cwd, "WORKLOG.md");
  const shortId = String(sessionId).slice(0, 8);
  const marker = `<!-- AUTO-STUB session:${shortId} -->`;

  try {
    const existing = existsSync(worklogPath) ? readFileSync(worklogPath, "utf8") : "";
    if (existing.includes(marker)) {
      // already stubbed this session (hook fired more than once) — don't duplicate
    } else {
      const date = new Date().toISOString().slice(0, 10);
      const stub = `\n## ${date} — session ${shortId} (auto-stub)\n${marker}\n- Session ended without a manual WORKLOG.md entry — replace this with a real\n  summary of what changed and why. Check \`git log\` around this date for\n  what actually happened.\n`;
      if (!existing) {
        writeFileSync(worklogPath, `# Work Log\n${stub}`);
      } else {
        appendFileSync(worklogPath, stub);
      }
      if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
    }
  } catch {
    // if we can't even write the stub, still attempt the block below
  }

  process.stdout.write(
    JSON.stringify({
      decision: "block",
      reason:
        "Added a placeholder WORKLOG.md entry (AUTO-STUB) for this session — replace it with a real summary of what changed and why before finishing.",
      systemMessage: "WORKLOG.md needs a real entry for this session before closing.",
    })
  );
}

main();
