# Skill: mongodb-pipeline-engineering

5-step workflow for generating, validating, and running MongoDB aggregation pipelines against the bootcamp collections.

## Steps

1. **Map the question to a collection** — `activity_events` for operational data, `kb_documents` for text search
2. **Confirm field names** — use exact schema from `src/query/schema.ts` or `memory/project_mongodb_schema.md`
3. **Generate pipeline** — stage by stage, with inline comment on each stage's purpose
4. **Validate before running** — check: no `$out`/`$merge`, `$limit` present, date syntax correct, amounts in cents
5. **Run and verify** — via MCP tools or `npm run dev`, confirm result count and values make sense

## activity_events field reference

| Field | Type | Notes |
|---|---|---|
| `userId` | string | |
| `userName` | string | |
| `action` | enum | LOGIN\|BALANCE_QUERY\|TRANSFER_INITIATED\|TRANSFER_APPROVED\|USER_CREATED\|USER_MODIFIED |
| `amount` | integer | **cents** — divide by 100 for dollars |
| `channel` | enum | WEB\|MOBILE\|API\|BRANCH |
| `status` | enum | SUCCESS\|FAILED\|PENDING |
| `timestamp` | BSON Date | Use `{ "$date": "ISO" }` or `$$NOW` + `$dateSubtract` |

## Pipeline checklist

- [ ] Field names match schema exactly
- [ ] `$limit` at end (default 50) or `$group` limits naturally
- [ ] No `$out` or `$merge`
- [ ] Date comparisons use Extended JSON or `$$NOW`
- [ ] `maxTimeMS: 5000` in options
- [ ] Amounts interpreted in cents, displayed in dollars

## Common patterns

```json
// Largest transfer this month
[{"$match": {"action": "TRANSFER_INITIATED", "timestamp": {"$gte": {"$date": "2026-08-01T00:00:00Z"}}}},
 {"$sort": {"amount": -1}}, {"$limit": 1}]

// Per-user totals
[{"$match": {"action": "TRANSFER_INITIATED", "status": "SUCCESS"}},
 {"$group": {"_id": "$userId", "total": {"$sum": "$amount"}, "userName": {"$first": "$userName"}}},
 {"$sort": {"total": -1}}, {"$limit": 50}]
```

## Forbidden

- `$out`, `$merge` (write stages)
- Field names not in schema (hallucinated fields)
- Floating-point amount comparisons (always integer cents)
