# Foundation Analysis — MongoDB Atlas Bootcamp Agent

## Architecture summary

The scaffold is a LangGraph ReAct agent with three selectable patterns, each a named tool set + system prompt combination. All patterns share a `remember` tool for long-term cross-thread user memory. The agent graph is a standard `START → model → tools → model → END` loop compiled with a MongoDB checkpointer (short-term) and a MongoDB store (long-term).

## Extension surface (what teams customize)

| File | Purpose |
|---|---|
| `src/patterns.ts` | Which tools and prompt each pattern uses |
| `src/agent/prompts/en.ts` + `es.ts` | Agent persona and instructions |
| `src/tools/*.ts` | New business tools |
| `src/tools/registry.ts` | Central tool registration |
| `src/query/schema.ts` | Collection description fed to LLM for query generation |
| `data/sample/` | Synthetic domain data |
| `.env` | All runtime configuration |

## Fixed surface (do not rewire)

| File | Reason |
|---|---|
| `src/llm/model.ts` | Provider isolation contract |
| `src/credentials.ts` | Lambda credential bootstrap |
| `src/db/client.ts` | Singleton MongoDB client |
| `src/agent/graph.ts` | LangGraph topology |

## Quality gates

1. `npm run typecheck` — TypeScript strict, must be clean
2. `npm run verify` — Acceptance tests for all three checkpoints
3. No secrets committed — `.env` is in `.gitignore`; keys minted at runtime

## Multi-runtime adapter layout

```
/memory/          ← canonical source of truth
.claude/          ← Claude Code adapter (thin pointers)
.codex/           ← Codex adapter (thin pointers)
.cursor/          ← Cursor IDE rules (thin pointers)
.agents/          ← Runtime-agnostic adapter (thin pointers)
scripts/agentic/  ← Python hook implementations
```

## Key invariants (see memory/policies/ for full detail)

1. Synthetic data only
2. Provider isolation via `getChatModel()`
3. Query tool read-only by design
4. Config from environment only
5. Tool registration required
6. TypeScript strict mode enforced
7. Memory reference discipline (no raw record contents)
8. Bilingual identifiers always English
9. Verdict tokens verbatim in all language prompt files
