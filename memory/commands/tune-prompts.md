# Command: /tune-prompts

**When to use:** Agent answers are off-topic, too verbose, not grounded, or using wrong tools.

## Steps

1. **Identify the failing pattern** — `rag`, `structured`, or `hybrid`?
2. **Read current prompt** — `src/agent/prompts/en.ts` (or `es.ts`)
3. **Reproduce the failure** — `npm run dev`, ask the same question
4. **Identify root cause** — wrong tool selection, ungrounded answer, wrong format, hallucination?
5. **Edit prompt** — delegate: `prompt-engineer`
6. **Verify bilingual parity** — if `en.ts` changed, update `es.ts` too
7. **Verify verdict tokens** — if hybrid prompt changed, confirm `CONSISTENT/INCONSISTENT/NEEDS REVIEW` present
8. **Validate** — `npm run typecheck` + `npm run verify` CP2/CP3

## Common prompt fixes

| Symptom | Fix |
|---|---|
| Agent answers from memory, not tools | Add "do not answer from prior knowledge when a tool can get the facts" |
| Agent calls wrong tool | Sharpen tool `description` text |
| Structured answers lack explanation | Add "always explain what pipeline produced the result" |
| Hybrid verdict missing | Add explicit instruction to call `assess` for record+policy questions |
| Bilingual answer mixing languages | Make `AGENT_LANGUAGE` instruction more explicit |

## Delegate: `prompt-engineer`
