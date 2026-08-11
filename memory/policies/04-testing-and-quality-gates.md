# Policy 04 — Testing and Quality Gates

## Minimum validation per change

| Change type | Required validation |
|---|---|
| TypeScript edit | `npm run typecheck` clean |
| New tool | typecheck + manual `npm run dev` invocation |
| Data change | `npm run load` + `npm run verify` |
| Prompt change | typecheck + `npm run verify` (checkpoint 2 and/or 3) |
| Memory change | typecheck + `npm run verify` (checkpoint 3) |
| Any change before commit | typecheck + `npm run verify` all green |

## Checkpoint tiers (from `scripts/verify.ts`)

- **Checkpoint 1**: Agent returns non-empty answers for RAG and structured patterns
- **Checkpoint 2**: Retrieval cites `.md` sources, structured_query returns correct records with `explanation`, hybrid assess emits a verdict token
- **Checkpoint 3**: ≥2 tools working, short-term memory resumes on same `thread_id`, long-term memory persists across threads, end-to-end hybrid scenario

## Test standards

- Tests in `src/**/__tests__/` or `*.test.ts` files, run with `vitest`
- No tests that mock the database (integration tests hit a real Atlas cluster)
- Deterministic: no wall-clock dependencies, no random IDs in assertions
- The verify script uses `computeExpectations(generateActivityEvents())` — expected values are always in sync with the data generator

## Forbidden

- Committing with typecheck errors
- Skipping `npm run verify` before a demo or checkpoint claim
- Tests that pass with mocked data but fail against the real Atlas cluster
- `console.log` left in source as a debugging artifact
