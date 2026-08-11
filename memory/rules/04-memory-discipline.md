# Rule 04 — Memory Discipline

## Two-layer model

| Layer | Scope | Managed by | Key identifier |
|---|---|---|---|
| Short-term | Per conversation thread | LangGraph MongoDBSaver (automatic) | `thread_id` |
| Long-term | Per user, cross-thread | `remember` tool + MongoDBStore | `user_id` |

## What to store (long-term)

Only lightweight, durable facts:

| Kind | Examples |
|---|---|
| `profile` | team name, role, department |
| `preference` | preferred channel, notification threshold |
| `reference` | IDs of events, users, or accounts the user cares about |

## What NOT to store

- Raw record contents (amounts, full event details, PII-adjacent fields)
- Derived calculations or aggregation results
- Session-specific context that won't be useful in a future conversation
- Anything that changes frequently (use the query tool for current state)

## Storage discipline

- `key`: stable snake_case identifier (e.g. `"team"`, `"role"`, `"watched_user_id"`)
- `summary`: one short sentence, no raw data
- `references`: array of record IDs only, maximum 10
- Never call `remember` with a summary that contains an `amount`, `balance`, or record content

## Recall flow

Long-term memory is injected into the system prompt automatically each turn (in `src/agent/graph.ts`). The model reads it as context. The `remember` tool only writes — there is no explicit `recall` tool call needed.

## Verify recall is working

Checkpoint 3 tests: same `user_id` + different `thread_id` → long-term facts are still present in the injected context.
