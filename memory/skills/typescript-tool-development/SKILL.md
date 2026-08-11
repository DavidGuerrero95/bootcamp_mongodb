# Skill: typescript-tool-development

7-step workflow for adding a new business tool to the bootcamp agent.

## Steps

1. **Identify the extension point** — confirm this belongs in `src/tools/`, not in a modification to `src/agent/graph.ts`
2. **Read neighbors** — inspect `src/tools/exampleBusinessTool.ts` and `src/tools/registry.ts` for local style
3. **Match local style** — same import order, same Zod pattern, same string-return convention
4. **Smallest correct implementation** — one file, one exported `tool()`, focused on exactly one concern
5. **Register** — `src/tools/registry.ts` → `allTools` + `src/patterns.ts` → `toolsForPattern()`
6. **Add test** — at minimum: valid input returns non-empty string, invalid input handled gracefully
7. **Validate** — `npm run typecheck` clean + `npm run dev` manual invocation

## Tool file anatomy

```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const myTool = tool(
  async ({ fieldName }): Promise<string> => {
    // implementation
    return "result string";
  },
  {
    name: "my_tool",                    // snake_case, unique
    description: "Concrete description of when the model should call this tool and what it returns.",
    schema: z.object({
      fieldName: z.string().describe("What this field is for, concretely."),
    }),
  }
);
```

## Key rules

- Return a plain string — the model reads it as text
- `description` is the model's decision surface — make it concrete, not generic
- Every Zod field must have `.describe()` text
- No side effects beyond the tool's stated concern
- No `any` types, no `process.env` reads, no provider SDK imports

## Forbidden

- Tools that call `getChatModel()` directly (the graph wires the model)
- Tools that modify `src/agent/graph.ts` behavior
- Tools that store raw record contents in memory
- More than 3 business tools per pattern
