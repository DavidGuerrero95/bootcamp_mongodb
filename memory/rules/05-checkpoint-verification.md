# Rule 05 — Checkpoint Verification

## Checkpoint gates

Progress is gated by `npm run verify`. Do not claim a checkpoint is done until it passes.

## Checkpoint 1 — Skeleton

**Gate:** Both RAG and structured agents return non-empty answers.

Required before claiming CP1:
- `npm run load` completed without errors
- `npm run verify` shows CP1 checks green

## Checkpoint 2 — Retrieval and Query

**Gate:** Correct, evidence-backed results.

Required:
- Retrieval cites `.md` source files (dual-control-standard.md for threshold questions)
- `structured_query` returns the correct largest transfer with an `explanation` field
- `structured_query` computes the correct per-user total
- Hybrid `assess` produces citations and emits `CONSISTENT | INCONSISTENT | NEEDS REVIEW`

Common CP2 failures:
- Vector index not created → run Atlas UI index creation
- Wrong embedding dimension → check `VOYAGE_EMBEDDING_DIMENSIONS` matches index
- Model generates wrong pipeline → improve collection description in `src/query/schema.ts`

## Checkpoint 3 — Tools, Memory, E2E

**Gate:** Tools work, memory persists, scenario completes.

Required:
- At least two business tools callable by the agent
- Short-term memory: rebuild agent between turns, same `thread_id` → recalls prior content
- Long-term memory: new `thread_id`, same `user_id` → recalls `remember`-stored fact
- End-to-end hybrid scenario: policy + records + verdict in one response

Common CP3 failures:
- `remember` not in tool set → add to `toolsForPattern()` in `src/patterns.ts`
- Long-term store not initialized → check `MEMORY_COLLECTION` env var and MongoDBStore setup
- Verdict token mismatch → check `CONSISTENT/INCONSISTENT/NEEDS REVIEW` in hybrid prompts

## Fast diagnosis

```bash
npm run typecheck        # eliminate TS errors first
npm run verify 2>&1 | grep -E "✓|✗|FAIL|PASS"
```
