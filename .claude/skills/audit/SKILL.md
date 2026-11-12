---
name: audit
description: Full privacy and security audit of the repository before a release or on request.
allowed-tools: Bash(git grep *) Bash(git log *) Bash(git ls-files *)
---

# Audit

Delegate to `privacy-security-auditor` for the whole repo (code, manifest, docs, CI, git history), then spot-check two of its findings yourself.
Return findings by severity with file:line and a concrete fix, plus an explicit list of what was not checked.
