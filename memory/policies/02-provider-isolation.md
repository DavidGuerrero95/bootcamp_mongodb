# Policy 02 — Provider Isolation

## Contract

Only `src/llm/model.ts` may import a model-provider or gateway SDK. Every other module reaches the chat model through `getChatModel()` and depends only on `@langchain/core` types.

## Why this exists

The scaffold can be rewired to a different Bedrock model or a different provider entirely by editing one file. If provider imports leak into tools, prompts, or the graph, that rewire requires touching every file that leaked.

## Embeddings and reranking

Embeddings and reranking are always Voyage AI, wired in `src/retrieval/`. Do not import the Voyage SDK outside those files.

## Forbidden

- `import ... from "@anthropic-ai/sdk"` outside `src/llm/model.ts`
- `import ... from "openai"` anywhere
- Any direct HTTP call to Bedrock, OpenAI, or Anthropic APIs outside the designated model file
- Hardcoding model IDs in tool files or prompt files — read from `getConfig().BEDROCK_MODEL_ID`

## Allowed

- `import type { ... } from "@langchain/core/..."` anywhere — types only, no runtime provider dependency
- `getChatModel()` in `src/agent/graph.ts` and nowhere else (the graph wires the model to the tools)

## Violation check

Run: `grep -r "@anthropic-ai\|openai\|from.*bedrock" src/ --include="*.ts" | grep -v "src/llm/model.ts"`
Any hit outside `src/llm/model.ts` is a violation.
