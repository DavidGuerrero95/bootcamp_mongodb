# Hook: post-edit-code-quality

**Trigger:** `PostToolUse` — Edit | Write

**Contract:** Inspect recently changed files and emit quality reminders. Never runs commands itself.

## Behavior by file type

| File type | Reminder emitted |
|---|---|
| `*.ts` in `src/tools/` | Recommend registering in `registry.ts` + adding to pattern in `patterns.ts` |
| `*.ts` in `src/agent/prompts/` or `src/hybrid/prompts/` | Recommend verifying verdict tokens + running `npm run verify` CP2/CP3 |
| `*.ts` in `src/retrieval/` | Recommend checking embedding dimensions match index |
| `*.ts` in `src/query/` | Recommend testing with `npm run dev` + `npm run verify` CP2 |
| `data/sample/**` | Recommend running `npm run load` then `npm run verify` |
| `.env` | Warn: confirm `.env` is in `.gitignore` and not staged |
| `*.md` in docs | Check that bilingual counterpart was also updated |

**Output:** `{ "systemMessage": "..." }` or `{}`

**Implementation:** `scripts/agentic/post_edit_code_quality.py`
