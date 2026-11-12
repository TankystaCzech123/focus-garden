---
name: release
description: Check release readiness - CI status, release-please PR, APK asset and signing - and prepare the hand-off. The user merges the release PR.
disable-model-invocation: true
allowed-tools: Bash(gh run *) Bash(gh pr view *) Bash(gh pr list *) Bash(gh release view *) Bash(git log *) Bash(git status *)
---

# Release

Delegate to `release-engineer`, then verify its report yourself.

1. `git status` clean and `origin/main` up to date; last CI run on `main` green (`gh run list`).
2. Release PR open (`gh pr list`), its changelog matches the commits since the last release.
3. Run `privacy-security-auditor` over the diff since the last release.
4. After the user merges the PR: confirm the release exists and the APK asset `focus-garden-vX.Y.Z-arm64-v8a.apk` is attached.
5. Report. **Never** merge the PR, tag, or publish on your own.
