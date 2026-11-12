---
name: preflight
description: Runs every local quality gate - typecheck, tests, secret and personal-data scan, docs-vs-code check - and reports a pass/fail table. Use before committing and before saying work is done.
allowed-tools: Bash(npm run *) Bash(npm test *) Bash(npx tsc *) Bash(git status *) Bash(git diff *) Bash(git grep *)
---

# Preflight

Run in parallel where possible and report facts. A check that cannot run is **SKIPPED** (say why), never counted as passed.

| # | Check | How |
|---|---|---|
| 1 | Types | `npm run typecheck` |
| 2 | Tests | `npm test` (report pass/fail counts) |
| 3 | Secrets | `git grep -nIE "(password|passwd|secret|api[_-]?key|token)\s*[:=]\s*['\"][^'\"]{8,}"` and any `*.jks`, `*.keystore`, `.env*` tracked or staged |
| 4 | Personal data | staged diff and tracked files contain no `/Users/<name>` paths and no e-mail other than `noreply` addresses |
| 5 | Docs | changed `src/rules.ts` ⇒ `docs/GAME_RULES.md` changed; changed manifest permissions or network code ⇒ `docs/PRIVACY.md` changed |
| 6 | Commit hygiene | staged changes only include intended files; no lockfile/CHANGELOG/version edits by hand |

Finish with a table (PASS / FAIL / SKIPPED + one line each) and the exact failing output.
