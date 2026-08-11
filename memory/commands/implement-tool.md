# Command: /implement-tool

**When to use:** Adding a new business tool to the agent.

## Steps

1. **Inspect** — read `src/tools/registry.ts` and `src/patterns.ts` to understand current tool set
2. **Read policies** — `policies/01-engineering-baseline.md`, `policies/03-langgraph-and-tools.md`
3. **Implement** — create `src/tools/<toolName>.ts` with `tool(fn, {name, description, schema})`
   - Delegate: `typescript-engineer`
4. **Register** — add to `src/tools/registry.ts` → `allTools`
5. **Add to pattern** — add to `src/patterns.ts` → `toolsForPattern()`
6. **Add tests** — delegate: `typescript-engineer`
7. **Validate** — `npm run typecheck` + `npm run dev` (manual invocation) + `npm run verify`
8. **Document** — update `README.md` tool table if needed; delegate: `technical-writer`

## Additional delegates

- `code-reviewer` for invariant check before commit
- `security-reviewer` if tool makes external calls or handles sensitive data

## Deliverable

New `src/tools/<toolName>.ts` + updated `registry.ts` + updated `patterns.ts` + passing typecheck + verify.
