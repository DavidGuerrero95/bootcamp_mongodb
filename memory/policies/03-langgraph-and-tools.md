# Policy 03 — LangGraph Agent, Tools, and Memory

## Graph topology (fixed)

```
START → model → [tool_calls?] → tools → model → ... → END
```

Do not rewire `src/agent/graph.ts`. The graph is the plumbing; tools are the extension surface.

## Tool registration

Every tool must be registered in two places:
1. `src/tools/registry.ts` → `allTools` array (for test/verify lookups)
2. `src/patterns.ts` → `toolsForPattern()` for the intended pattern(s)

Missing either registration means the model cannot call the tool.

## Tool authoring rules

- One tool per file in `src/tools/`
- `name` must be snake_case and unique across all tools
- `description` must be concrete — the model uses it to decide when to call the tool
- Input schema via Zod; every field must have a `.describe()` string
- Return a plain string (the model reads it as text)
- No side effects that mutate shared state outside the tool's own concern
- Maximum two to three business tools per pattern — more dilutes the model's tool-selection accuracy

## Memory layers

| Layer | Scope | Mechanism | How to read | How to write |
|---|---|---|---|---|
| Short-term | Per `thread_id` | MongoDBSaver checkpointer | Automatic (LangGraph) | Automatic (LangGraph) |
| Long-term | Per `user_id`, cross-thread | MongoDBStore | Injected into system prompt each turn | `remember` tool |

## Memory discipline (long-term)

- Store only `profile`, `preference`, or `reference` kinds
- Summary: one short sentence maximum
- References: record IDs only — never raw record contents
- Key: stable identifier (e.g. `"team"`, `"role"`, `"preferred_channel"`)

## Verdict tokens

`CONSISTENT`, `INCONSISTENT`, `NEEDS REVIEW` are matched by `scripts/verify.ts` with a regex. These tokens must appear verbatim in every language variant of the hybrid prompt (`src/hybrid/prompts/en.ts`, `es.ts`). Do not translate them.
