# Skill: retrieval-tuning

Workflow for diagnosing and improving retrieval quality in the RAG and hybrid patterns.

## Steps

1. **Verify data exists** — `kb_documents` count > 0 in Atlas
2. **Verify vector index** — Atlas UI → Search Indexes → `vector_index`, field `embedding`, 1024 dims, cosine
3. **Identify failure mode** — no results / wrong sources / irrelevant passages / right source wrong section
4. **Tune the right lever** — see table below
5. **Validate** — `npm run verify` CP2 passes, passages cite `.md` sources, `dual-control-standard.md` found

## Failure mode → lever mapping

| Failure mode | Lever | Location |
|---|---|---|
| No results at all | Vector index missing or wrong dim | Atlas UI |
| Wrong embedding dim | `VOYAGE_EMBEDDING_DIMENSIONS` | `.env` + Atlas index |
| Right docs not recalled | Increase `RETRIEVAL_TOP_K` | `.env` |
| Right docs recalled, wrong order | Increase `RERANK_TOP_K` | `.env` |
| Chunks lack context | Switch to `voyage-context-4` | `.env` → re-index required |
| Domain vocabulary poor | Use domain model | `.env` → re-index required |
| Slow retrieval | `rerank-2.5-lite` | `.env` |

## Re-index warning

Changing `VOYAGE_EMBEDDING_MODEL` requires:
1. Update `VOYAGE_EMBEDDING_DIMENSIONS` to match new model
2. Drop existing `vector_index` in Atlas UI
3. Re-run `npm run load`
4. Re-create vector index with new dimensions

**Always recommend, never silently switch.** Changing the model without re-indexing produces garbage retrieval.

## Passage quality check

Good passage output:
```
[1] dual-control-standard.md > Transfer Limits (relevance 0.912)
All transfers above $10,000 require dual-control authorization...
```

Bad: generic passages, wrong source, relevance < 0.5, source not a `.md` file.
