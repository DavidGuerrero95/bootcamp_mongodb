# Policy 01 — Engineering Baseline

## Stack (fixed)

- TypeScript 5, `strict: true`, `noUncheckedIndexedAccess: true`, ESM modules (`"type": "module"`)
- Node 20+. Run TS directly with `tsx`.
- LangChain ecosystem: `@langchain/core`, `@langchain/aws`, `@langchain/langgraph`, `@langchain/mongodb`, `@langchain/langgraph-checkpoint-mongodb`
- MongoDB native driver v7
- Zod v4 for all schema validation
- Base package path: `src/`

## Mandatory conventions

- Constructor-style imports, no `require()` in TypeScript source
- All configuration from environment via `getConfig()` — no inline `process.env` reads outside `src/config.ts`
- New tools: one file per tool in `src/tools/`, registered via `src/tools/registry.ts`
- Tool `description` and field `.describe()` text are the model's interface — make them concrete and specific
- Zod schemas on all tool inputs
- Errors are explicit and actionable; no silent swallowing

## Forbidden

- `any` casts that bypass strict mode
- `process.env` reads outside `src/config.ts`
- Hardcoded secrets or API keys anywhere in source
- Wildcard re-exports that obscure what a module provides
- `console.log` left in committed code (use structured error messages)
- Dependencies added without rationale
- Child tool files that duplicate logic from `src/agent/graph.ts` or `src/db/client.ts`

## Quality gates (must pass before done)

1. `npm run typecheck` — zero errors
2. `npm run verify` — all three checkpoint tiers green
3. No secrets in any committed file
