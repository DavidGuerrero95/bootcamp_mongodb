# Command: /debug-retrieval

**When to use:** Retrieval is returning irrelevant passages, empty results, or wrong sources.

## Diagnostic steps

1. **Verify data** — confirm `kb_documents` collection has documents: `npm run verify` CP1
2. **Check index** — Atlas UI → Search Indexes → confirm `vector_index` exists on `embedding` field, cosine similarity, 1024 dimensions
3. **Check embedding model** — `VOYAGE_EMBEDDING_MODEL=voyage-4-large`, `VOYAGE_EMBEDDING_DIMENSIONS=1024`
4. **Test retrieval directly** — in `npm run dev`, ask a question that should match a known document
5. **Check reranker** — `VOYAGE_RERANK_MODEL=rerank-2.5`, `RERANK_TOP_K=4` ≤ `RETRIEVAL_TOP_K=10`
6. **Inspect passages** — verify `source` field contains `.md` filenames

## Tuning levers

| Lever | Effect | Trade-off |
|---|---|---|
| Increase `RETRIEVAL_TOP_K` | More recall | Slower, more noise for reranker |
| Increase `RERANK_TOP_K` | More passages in context | Larger prompt, higher cost |
| Use `voyage-context-4` | Better chunk context | Different dimension, requires re-index |
| Domain model (`voyage-finance-2` etc.) | Better domain vocab | Different dimension, requires re-index |

## Delegate: `retrieval-tuner`

For systematic retrieval quality analysis, delegate to `retrieval-tuner` with the failing query and expected source.
