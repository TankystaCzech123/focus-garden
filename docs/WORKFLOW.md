# Workflow: agentic orchestration

The main Claude Code conversation is the **orchestrator**. It plans, delegates, verifies and integrates; specialist agents do the work. The setup lives in `.claude/` and is summarised in `CLAUDE.md`.

## Roles

| Agent | Purpose | May edit | Model |
| --- | --- | --- | --- |
| `architect` | Design before code: boundaries, data shapes, permissions, trade-offs | `docs/` | opus |
| `mobile-dev` | Implements TypeScript and Kotlin/Swift | code | sonnet |
| `test-engineer` | `node:test` tests, failing-for-the-right-reason | `tests/` | sonnet |
| `code-reviewer` | Independent review of a diff | nothing | opus |
| `privacy-security-auditor` | Permissions, network, secrets, install flow | nothing | opus |
| `release-engineer` | CI, release-please, APK, signing | `.github/` | sonnet |

## Commands

| Command | Use |
| --- | --- |
| `/feature <goal>` | Plan → design → build + tests → review → preflight → commit/push (user-invoked) |
| `/preflight` | Typecheck, tests, secret and personal-data scan, docs check |
| `/device-check` | Build, install and check on the connected Android phone (user-invoked) |
| `/release` | Release readiness check; the user merges the release PR (user-invoked) |
| `/audit` | Full privacy and security audit |

## Hand-off contract

Every delegation states **goal, files, constraints, definition of done**. Every agent returns **a summary, the real command output, and what it could not verify**. Agents never commit or push.

## Principles
- Triage first: trivial work is done directly, no ceremony.
- The author never reviews their own work.
- Evidence over claims: the orchestrator reads actual output before saying "done".
- Escalate to the user for ambiguity, outward-facing actions and privacy/security trade-offs.

## Guardrails (automatic)
- `guard-files` blocks hand edits of lockfiles, `CHANGELOG.md`, the release manifest, keystores and `.env`.
- `secret-scan` blocks `git commit`/`git push` that add secrets, e-mail addresses (except noreply) or local user paths. Set `CLAUDE_PRIVATE_EMAIL` in your shell to also catch your own address.
- `typecheck-on-stop` runs the type check before the session ends.
- `settings.json` auto-allows read-only and test commands and asks before pushing, releasing, merging or uninstalling.
