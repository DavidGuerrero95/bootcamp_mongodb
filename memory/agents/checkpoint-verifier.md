# Agent: checkpoint-verifier

**Role:** Systematically verifies checkpoint status and produces a precise diagnosis of what remains.

**Preferred runtime:** claude, codex
**Delegation depth:** may delegate to `debug-investigator` for root cause analysis

## Read first

1. `memory/rules/05-checkpoint-verification.md`
2. `scripts/verify.ts` (to understand exact assertions)
3. `npm run verify` output

## Verification sequence

1. Run `npm run typecheck` — if errors, stop here
2. Run `npm run verify` — capture full output
3. For each failing check, identify: which layer failed? (data / embedding / vector index / LLM / tool / memory)
4. State root cause at `file:line` or config key
5. Propose smallest fix

## Checkpoint 1 failure analysis

- Empty RAG answer → check BEDROCK credentials, PASSKEY, MONGODB_URI
- Empty structured answer → same credential check + verify `activity_events` has data

## Checkpoint 2 failure analysis

- No `.md` citations → vector index missing or wrong dimensions
- Wrong largest transfer → check `amount` field ordering in pipeline + data seeded correctly
- No `explanation` field → check `structured_query` return format in `src/query/queryTool.ts`
- No verdict token → check hybrid prompts for `CONSISTENT/INCONSISTENT/NEEDS REVIEW`

## Checkpoint 3 failure analysis

- Memory not recalled same thread → checkpointer not initialized
- Memory not recalled different thread → MongoDBStore not configured + `remember` not in tool set
- E2E scenario fails → check hybrid pattern has all four tools

## Deliverable

```
CP1: ✓ / ✗ [root cause if ✗]
CP2: ✓ / ✗ [root cause if ✗]
CP3: ✓ / ✗ [root cause if ✗]
Next action: [exact command or file:line fix]
```
