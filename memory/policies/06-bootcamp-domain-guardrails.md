# Policy 06 — Bootcamp Domain Guardrails

## Data compliance

Use synthetic data only. No customer PII, no real transaction records, no regulated or production data anywhere in the repository. The sample data in `data/sample/` is the only permitted data source. Do not add code paths that assume real or production data.

## Extension points (edit freely)

| File/Directory | Purpose |
|---|---|
| `src/patterns.ts` | Tool sets and prompts per pattern |
| `src/agent/prompts/en.ts` + `es.ts` | Agent persona and system prompt |
| `data/sample/` | Synthetic domain data |
| `src/tools/*.ts` | New business tools |
| `src/tools/registry.ts` | Tool registration |
| `src/query/schema.ts` | Collection descriptions for query tool |
| `.env` | Runtime configuration |

## Fixed surface (do not modify without explicit justification)

| File | Reason |
|---|---|
| `src/llm/model.ts` | Provider isolation contract |
| `src/credentials.ts` | Lambda credential bootstrap |
| `src/db/client.ts` | Singleton MongoDB connection |
| `src/agent/graph.ts` | LangGraph topology |

## Checkpoint requirements

All three checkpoints must pass against the team's own data before the agent is considered done:
1. `npm run verify` Checkpoint 1: skeleton runs
2. `npm run verify` Checkpoint 2: retrieval and query correct
3. `npm run verify` Checkpoint 3: tools, memory, and E2E scenario

## Tool count

Keep two to three business tools per pattern. More than three dilutes the model's tool-selection accuracy and adds prompt complexity. Propose extras in the README rather than adding them to the agent.

## Bilingual constraint

`AGENT_LANGUAGE` selects the prompt set. Identifiers, field names, enum values, JSON keys, and verdict tokens (`CONSISTENT`, `INCONSISTENT`, `NEEDS REVIEW`) are always English regardless of language setting. Only prose is translated.
