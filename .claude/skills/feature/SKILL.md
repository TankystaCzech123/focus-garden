---
name: feature
description: Build a feature end to end with agent orchestration - plan, design, implement, test, independent review, preflight, commit and push. Use only when the user asks for a feature or non-trivial change.
argument-hint: "<what to build>"
disable-model-invocation: true
---

# Feature

Request: `$ARGUMENTS`

You are the orchestrator. Do not write large changes yourself.

1. **Triage.** If trivial (one-liner, wording, typo), just do it and skip to step 6.
2. **Plan.** Restate goal, constraints and "done" in a few lines. Ask the user only if something blocks a decision.
3. **Design** (non-trivial only): delegate to `architect`. Read its design; reject anything bigger than needed.
4. **Build in parallel where independent:** `mobile-dev` implements; `test-engineer` writes tests for the pure rules from the design. Give each the contract: goal, files, constraints, definition of done.
5. **Independent review:** run `code-reviewer`; add `privacy-security-auditor` when permissions, network, storage, native code or CI changed. Send blockers/should-fix back to `mobile-dev`, then re-review. Never review your own or the author's work.
6. **Preflight:** run `/preflight` and read the real output.
7. **Docs:** `docs/GAME_RULES.md` for rule changes, `docs/PRIVACY.md` for permission/network/data changes, README feature list if user-visible.
8. **Ship:** Conventional Commit (GitHub noreply identity), push to `origin main`, check CI. Report what was done, what was verified, and what was not (e.g. iOS).
