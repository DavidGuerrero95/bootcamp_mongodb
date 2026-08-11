# Skill: bootcamp-checkpoint-runner

Workflow for systematically passing all three checkpoint tiers.

## Phase 1 → Checkpoint 1

**Goal:** Scaffold runs, both agents answer.

```bash
# 1. Configure .env
cp .env.example .env
# Edit .env: MONGODB_URI, PASSKEY, LAMBDA_CREDENTIALS_URL

# 2. Install + typecheck
npm install
npm run typecheck

# 3. Load data
npm run load

# 4. Test skeleton
npm run verify  # CP1 should be green
```

**Stuck?** Check: PASSKEY valid? MONGODB_URI correct? Atlas cluster accessible?

## Phase 2 → Checkpoint 2

**Goal:** Retrieval cites correct sources, structured query returns correct records.

```bash
# 1. Create vector index in Atlas UI
# → Search Indexes → Create → vector_index
# → field: embedding, dimensions: 1024, similarity: cosine

# 2. Wait 1-2 min for index to build, then:
npm run verify  # CP2 checks
```

**Stuck?** Check: index dimensions match `VOYAGE_EMBEDDING_DIMENSIONS`? `src/query/schema.ts` describes fields correctly?

## Phase 3 → Checkpoint 3

**Goal:** Tools, memory, E2E scenario working.

```bash
# 1. Confirm remember is in toolsForPattern()
grep -n "remember" src/patterns.ts

# 2. Confirm MEMORY_COLLECTION is set in .env
grep MEMORY_COLLECTION .env

# 3. Run full verify
npm run verify  # CP3 checks
```

**Stuck?** Check: `toolsForPattern("hybrid")` includes `remember`? MongoDBStore initialized in `src/agent/graph.ts`?

## Final gate

```bash
npm run typecheck && npm run verify
# All green = definition of done
```
