# Command: /load-data

**When to use:** Seeding or reseeding the MongoDB Atlas collections with sample data.

## Steps

1. Verify `.env` has `MONGODB_URI`, `PASSKEY`, and `LAMBDA_CREDENTIALS_URL`
2. Run `npm run load`
3. Confirm insertion counts for `kb_documents` and `activity_events`
4. If CP2 tests were previously failing due to data issues, run `npm run verify` after load

## Expected output

```
Loaded N kb_documents
Loaded M activity_events
```

## Common failures

| Error | Cause | Fix |
|---|---|---|
| `MONGODB_URI is required` | `.env` missing or not loaded | Check `.env` exists and has correct URI |
| `Authentication failed` | Wrong credentials | Check Atlas cluster user and password |
| `VOYAGE_API_KEY missing` | Credentials not bootstrapped | Check `PASSKEY` and Lambda URL |
| Insertion count = 0 | Collection already has data | Drop collections in Atlas UI first, then reload |

## After load

Vector index must exist on `kb_documents.embedding` before retrieval works. If the index was just created, allow 1-2 minutes for it to build before testing.
