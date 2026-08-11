# Rule 01 — Task Execution Flow

## 8-step sequence

1. **Frame scope** — which checkpoint tier does this task target?
2. **Read canonical files** — relevant policy + the affected source files
3. **Inspect the codepath** — trace from the extension point to the affected output
4. **Decide delegation** — does this need a specialized agent? (see `rules/03-subagent-delegation.md`)
5. **Smallest safe change** — implement the minimal diff at the right extension point
6. **Validate** — `npm run typecheck` clean, then `npm run verify` for the affected tier
7. **Update documentation** — if tool names, env vars, collection names, or checkpoint requirements changed
8. **Summarize** — what changed, what was validated, open follow-ups

## Definition of ready (answer before starting)

- Which file(s) will be touched?
- Which checkpoint tier does this enable or affect?
- Is there a policy constraint that limits the approach?
- Will documentation need to be updated?
- Is the change reversible without data loss?

## Escalation triggers

Stop and ask the user before proceeding if:
- The task requires modifying a fixed-surface file (`graph.ts`, `model.ts`, `credentials.ts`, `client.ts`)
- The task would add a destructive MongoDB operation
- The task would add a real (non-synthetic) data source
- A quality gate threshold would be weakened or bypassed
