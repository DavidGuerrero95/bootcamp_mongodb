# Command: /add-memory

**When to use:** Designing or adding new long-term memory keys for the agent.

## Steps

1. **Define the use case** — what fact needs to persist across threads? Why can't the query tool provide it?
2. **Choose the kind** — `profile` (who the user is), `preference` (how they work), `reference` (IDs they care about)
3. **Name the key** — stable snake_case, e.g. `"team"`, `"risk_threshold"`, `"watched_account_id"`
4. **Define the summary format** — one sentence max, no raw amounts or record contents
5. **Add to `remember` tool calls** — the model will call `remember` with the new key when appropriate
6. **Update system prompt** — add instruction to the agent prompt so it knows when to call `remember` for this key
7. **Validate** — CP3 cross-thread recall test

## Memory discipline check

Before adding a new key, answer:
- Can the query tool retrieve this on demand? If yes, don't store it in memory.
- Does this key contain PII or sensitive amounts? If yes, do NOT store it.
- Will this fact be useful in a future conversation? If no, don't persist it.

## Delegate: `memory-architect`
