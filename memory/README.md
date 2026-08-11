# /memory — canonical source of truth

Single, version-controlled source of truth for agent operation across Claude Code, Codex, and Cursor.

## Folder purposes

```
policies/       — Non-negotiable invariants (9 invariants, 8 policy files)
rules/          — Execution flow and definition of done
skills/         — Named, reusable workflows
agents/         — Specialized personas
hooks/          — Lifecycle automation contracts
commands/       — User-invoked entrypoints
output-styles/  — Communication tone only
```

## Precedence

```
platform safety → policies → rules → skills/agents → output-styles → ad hoc prompt → adapter folders
```

## Stack

- TypeScript 5 strict ESM, Node 20+
- LangChain/LangGraph (`@langchain/core`, `@langchain/aws`, `@langchain/langgraph`, `@langchain/mongodb`)
- AWS Bedrock → `global.anthropic.claude-sonnet-4-6`
- Voyage AI → `voyage-4-large` (1024-dim embeddings), `rerank-2.5`
- MongoDB Atlas → Vector Search, aggregation framework, MongoDBSaver (checkpointer), MongoDBStore (memory)
- Zod v4

## Extension rule

Consult `MANIFEST.md` → justify new file → update `MANIFEST.md` → adapters reference, never copy.
