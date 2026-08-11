# Command: /verify-checkpoints

**When to use:** Checking current checkpoint status and identifying what remains.

## Steps

1. Run `npm run typecheck` — if errors, stop and report before proceeding
2. Run `npm run verify` — capture full output
3. Group results by checkpoint tier (CP1 / CP2 / CP3)
4. For first failing check, identify root cause and next action

## Output format

```
Checkpoint 1 — Skeleton
  ✓ RAG agent returns non-empty answer
  ✓ Structured agent returns non-empty answer

Checkpoint 2 — Retrieval + Query
  ✓ Retrieval cites .md sources
  ✗ structured_query largest transfer — FAIL
    → Cause: amount field mismatch (stored in cents, expected dollars?)
    → Fix: check QUERY_RESULT_CAP and pipeline $sort field

Checkpoint 3 — Tools + Memory + E2E
  [not reached — CP2 must pass first]
```

## Delegate

- `checkpoint-verifier` for systematic diagnosis
- `mongo-pipeline` if CP2 pipeline failures
- `debug-investigator` if CP3 memory failures
