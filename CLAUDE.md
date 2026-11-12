# Focus Garden – project guide

Gamified focus app for Android + iOS: Expo (React Native, TypeScript) + a local native module (Kotlin/Swift). No backend. KISS.

## Commands
- `npm run typecheck` · `npm test` (node:test, `tests/`) · `npm run android` · `npm run ios`

## Layout
- `src/rules.ts` – pure game rules (streak, ice cubes, rewards, garden, XP, badges). No React/storage imports, always tested.
- `src/` – screens/components, `update.ts` (GitHub update check); `modules/focus-native/` – native module; `docs/` – architecture, rules, setup, privacy, workflow.
- `.claude/` – agents, skills, hooks, path-scoped rules. How it all fits together: `docs/WORKFLOW.md`.

## Orchestration policy
The main conversation is the **orchestrator**: it plans, delegates, verifies and integrates. Specialists do the work.
1. **Triage.** Trivial (typo, one-line, docs wording, question) → do it directly. Anything else → short plan first, then delegate.
2. **Delegate by role:** `architect` (design) → `mobile-dev` (implementation) + `test-engineer` (tests) → `code-reviewer` and `privacy-security-auditor` (independent, read-only) → `release-engineer` (CI/release).
3. **Brief every agent** with: goal, files, constraints, definition of done. Agents do not commit or push; the orchestrator does.
4. **Never self-review.** The agent that wrote code does not review it. Review findings are fixed and re-checked, not argued away.
5. **Verify, don't trust.** Read the real command output (typecheck, tests, CI) before reporting anything as done. Say plainly what is unverified (e.g. iOS has no device).
6. **Escalate to the user** for ambiguous requirements, outward-facing actions and security/privacy trade-offs. Otherwise decide, state the decision, move on.

## Definition of done
1. `npm run typecheck && npm test` pass (real output).
2. New behaviour has tests; game-rule changes also update `docs/GAME_RULES.md`.
3. New permission, network use or stored data → `docs/PRIVACY.md` updated and justified.
4. Independent review done for non-trivial changes; findings resolved.
5. Conventional Commit, pushed to `origin main` (standing instruction), CI green.

## Hard rules
- Conventional Commits (`feat:`, `fix:` ...): release-please generates releases. Never edit `CHANGELOG.md`, `.release-please-manifest.json`, version numbers or lockfiles by hand.
- No secrets, keystores, passwords or personal data (names, e-mail, local paths) in the repo, commits or logs. Commits use the GitHub noreply identity.
- Outward actions (publishing a release, merging the release PR, making things public, sending data to services) only when the user asks.
- Never reset the phone, clear app data or uninstall without explicit consent.
- Android focus mode uses an accessibility service that reads only the foreground package name. Xiaomi Game Turbo packages must stay ignored (docs/ARCHITECTURE.md).
- Never weaken tests or skip them to get green. A flaky test is a bug.
