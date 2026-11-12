---
name: release
description: Check release readiness - CI status, latest auto-published release, APK asset and signing.
disable-model-invocation: true
allowed-tools: Bash(gh run *) Bash(gh pr view *) Bash(gh pr list *) Bash(gh release view *) Bash(git log *) Bash(git status *)
---

# Release

Delegate to `release-engineer`, then verify its report yourself.

1. `git status` clean and `origin/main` up to date; last CI run on `main` green (`gh run list`).
2. Latest release exists (`gh release view`) and matches the last app-changing commit on `main`.
3. Run `privacy-security-auditor` over the diff since the last release.
4. Confirm the APK asset `focus-garden-vX.Y.Z-arm64-v8a.apk` is attached and its signing certificate matches the local debug key (updates only install over the same key).
5. Report. Releases are automatic; never tag or publish by hand.
