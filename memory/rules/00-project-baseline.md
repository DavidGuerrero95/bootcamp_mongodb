# Rule 00 — Project Baseline

## Working mode

Every non-trivial task follows four steps:

1. **Inspect** — read the affected files before touching anything
2. **Change** — smallest safe diff; no cleanup bundled with the main task unless it's in the critical path
3. **Validate** — `npm run typecheck`, then `npm run verify` for the affected checkpoint tier
4. **Summarize** — state what changed, what was validated, and any open follow-ups

## Minimal diffs over rewrites

Prefer adding to existing files over replacing them. Prefer editing one function over refactoring a module. A 10-line targeted diff is always better than a 200-line rewrite for the same outcome.

## Flag violations, don't silently fix them

If a change would violate a policy (wrong import, missing tool registration, adding real data), flag it to the user rather than silently extending the violation pattern.

## Policy files win over chat history

If a conversation suggests something that contradicts `/memory/policies/`, the policy wins. Restate the constraint and ask for clarification.

## Task scope

Keep tasks small enough to complete and validate in one session. If the scope expands beyond the current checkpoint tier, split it and re-plan before continuing.
