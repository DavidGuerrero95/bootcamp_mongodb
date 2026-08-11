# Hook: pre-bash-safety-guard

**Trigger:** `PreToolUse` — Bash

**Contract:** Deny or warn on destructive shell commands before they execute.

## Deny patterns (block execution)

- `rm -rf /` or `rm -rf .` at repo root
- `git push --force` on main/master
- `git reset --hard` without explicit user confirmation
- `git clean -fd` without explicit user confirmation
- `DROP DATABASE` / `DROP COLLECTION` on non-test Atlas cluster
- `deleteMany({})` without a filter (wipes entire collection)
- Any command piping secrets to a file or stdout

## Warn patterns (emit warning, allow execution)

- `rm -rf <any path>` (not covered by deny)
- `git checkout .` or `git restore .`
- `npm run dev` (long-running, confirm intent)
- Force-deleting node_modules

## Allow without prompt

- `npm run typecheck`
- `npm run verify`
- `npm run load`
- `npm run test`
- `git status`, `git log`, `git diff`, `git add`, `git commit`
- `grep`, `find`, `ls`, `cat`, `head`, `tail`
- `tsx`, `tsc`

**Output:** `{ "hookSpecificOutput": { "permissionDecision": "deny" } }` | `{ "systemMessage": "..." }` | `{}`

**Implementation:** `scripts/agentic/pre_bash_safety_guard.py`
