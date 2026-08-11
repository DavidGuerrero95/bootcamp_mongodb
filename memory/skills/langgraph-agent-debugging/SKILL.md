# Skill: langgraph-agent-debugging

Workflow for diagnosing failures in the LangGraph ReAct loop, tool calls, and memory layers.

## Steps

1. **Reproduce** — run `npm run verify` and capture the exact failing assertion
2. **Identify the layer** — credentials → data → embedding → retrieval → LLM call → tool routing → tool execution → memory → response parsing
3. **Inspect the specific layer** — read the relevant source file
4. **State root cause** — one sentence at `file:line` or config key
5. **Apply smallest fix** — at the correct extension point only
6. **Validate** — typecheck + verify

## Layer diagnostic commands

```bash
# Layer 1: Credentials
node -e "import('./src/credentials.ts').then(m => m.bootstrapCredentials())"

# Layer 2: DB connection  
npm run load  # should succeed

# Layer 3: LLM call
npm run dev   # ask a simple question — does it respond at all?

# Layer 4: Tool routing
npm run dev   # ask a question that requires a specific tool — does it call it?

# Layer 5: Memory
npm run verify 2>&1 | grep -i memory
```

## Common failure patterns

| Symptom | Likely layer | Fix location |
|---|---|---|
| `recursion limit exceeded` | Tool routing loop | Check tool description clarity |
| `tool not found` | Tool registration | `registry.ts` + `patterns.ts` |
| Empty response | LLM credentials | `.env` BEDROCK_MODEL_ID + AWS keys |
| Memory not recalled same thread | Checkpointer | `src/memory/checkpointer.ts` |
| Memory not recalled across threads | MongoDBStore | `src/memory/store.ts` + `MEMORY_COLLECTION` |
| Tool called but wrong result | Tool implementation | `src/tools/<toolName>.ts` |
| `getStore() returns undefined` | Store not in config | Check `buildAgent()` in `graph.ts` |

## LangGraph invariant

The graph topology is `START → model → tools → model → END`. If the model never reaches END, it's stuck in a tool-call loop. Check that tool descriptions don't encourage infinite calls.
