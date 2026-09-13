#!/usr/bin/env node
// PostToolUse (Write|Edit) hook: tracks per-session state for the
// SessionEnd worklog nudge.
// - Any successful Write/Edit marks ".activity" — "something meaningful
//   happened this session," regardless of which file.
// - A Write/Edit to WORKLOG.md specifically marks ".worklog-written" — the
//   session already logged itself, no nag needed.
// SessionEnd uses both: no nag if there's no activity at all, no nag if
// there's activity but it was already logged.
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

function main() {
  let input = {};
  try {
    input = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    return; // malformed/missing stdin — nothing to do, fail open
  }

  const cwd = input?.cwd || process.cwd();
  const sessionId = input?.session_id || "unknown-session";
  const stateDir = join(cwd, ".claude", "state");

  try {
    if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });

    writeFileSync(join(stateDir, `${sessionId}.activity`), new Date().toISOString());

    const filePath =
      input?.tool_response?.filePath ?? input?.tool_input?.file_path ?? "";
    if (basename(String(filePath)) === "WORKLOG.md") {
      writeFileSync(join(stateDir, `${sessionId}.worklog-written`), new Date().toISOString());
    }
  } catch {
    // best-effort only — never fail the tool call over this
  }
}

main();
