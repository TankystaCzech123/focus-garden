#!/usr/bin/env node
// PreToolUse(Bash): before `git commit` / `git push`, scan the lines being added for secrets and personal data.
// Optional: set CLAUDE_PRIVATE_EMAIL in your shell to also catch your own address (never write it into the repo).
import { readInput, projectDir, run, denyPreToolUse } from './_lib.mjs';

const input = await readInput();
const cmd = input?.tool_input?.command ?? '';
const isCommit = /\bgit\s+(-C\s+\S+\s+)?commit\b/.test(cmd);
const isPush = /\bgit\s+(-C\s+\S+\s+)?push\b/.test(cmd);
if (!isCommit && !isPush) process.exit(0);

const root = projectDir(input);
const diff = isCommit
  ? run('git', ['diff', '--cached', '-U0'], { cwd: root })
  : run('git', ['diff', '-U0', 'origin/main...HEAD'], { cwd: root });
if (!diff.ok) process.exit(0);

const added = diff.out.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++'));
const rules = [
  [/\/Users\/[A-Za-z][A-Za-z0-9._-]+/, 'a local user path (/Users/<name>)'],
  [/[A-Za-z0-9._%+-]+@(?!users\.noreply\.github\.com|anthropic\.com|example\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, 'an e-mail address'],
  [/(gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/, 'a token or private key'],
  [/(password|passwd|secret|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}['"]/i, 'a hard-coded credential'],
];
const mine = process.env.CLAUDE_PRIVATE_EMAIL;
const hits = [];
for (const line of added) {
  for (const [re, what] of rules) if (re.test(line)) hits.push(`${what}: ${line.slice(0, 80)}`);
  if (mine && line.toLowerCase().includes(mine.toLowerCase())) hits.push('your private e-mail');
}
if (hits.length) {
  denyPreToolUse(`Blocked ${isCommit ? 'commit' : 'push'}: the change adds sensitive-looking data.\n${[...new Set(hits)].slice(0, 8).join('\n')}\nRemove it (or ask the user if it is a false positive).`);
}
