# AGENTS.md — Codex / External Agent Operating Guide

Treat `/memory` as the authoritative instruction source. Adapter folders (`.claude/`, `.codex/`, `.cursor/`, `.agents/`) are thin pointers only — never duplicate content into them.

## Read order

1. `/memory/README.md`
2. `/memory/MANIFEST.md`
3. Relevant `memory/policies/` files
4. Active `memory/rules/` file
5. Relevant `memory/skills/` or `memory/agents/` docs

## Working agreements

- Inspect before editing. Prefer minimal diffs over rewrites.
- Keep provider SDKs isolated to `src/llm/model.ts`. Use `getChatModel()` and `@langchain/core` types everywhere else.
- Keep secrets out of source — `src/credentials.ts` mints AWS and Voyage keys at runtime.
- Extension points only: `src/patterns.ts`, `src/agent/prompts/`, `src/tools/`, `src/query/schema.ts`, `data/sample/`, `.env`.
- Do NOT modify: `src/llm/model.ts`, `src/credentials.ts`, `src/db/client.ts`, `src/agent/graph.ts`.

## Stack

- TypeScript 5 strict ESM, Node 20+, `tsx` for direct execution
- LangChain (`@langchain/core`, `@langchain/aws`, `@langchain/langgraph`, `@langchain/mongodb`)
- AWS Bedrock → `global.anthropic.claude-sonnet-4-6`
- Voyage AI → `voyage-4-large` (embeddings), `rerank-2.5` (reranker)
- MongoDB Atlas → Vector Search, Atlas Search, aggregation framework
- Zod v4 for schema validation

## Project context

MongoDB Atlas AI agent bootcamp — proof-of-concept in ~4-5 hours.
Three patterns: `rag`, `structured`, `hybrid`. Three checkpoints verified by `npm run verify`.
Repo: https://github.com/DavidGuerrero95/bootcamp_mongodb

## Adapter configs

- Claude Code: `.claude/`
- Codex: `.codex/`
- Cursor: `.cursor/`
- Agentless: `.agents/`
- Everything else: thin pointers back to `/memory`.
