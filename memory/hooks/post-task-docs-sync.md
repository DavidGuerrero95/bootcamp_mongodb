# Hook: post-task-docs-sync

**Trigger:** `Stop`

**Contract:** If TypeScript source files changed but no documentation files changed, emit a one-line reminder citing `policies/07-documentation-and-traceability.md`.

## Logic

1. Run `git diff --name-only` (staged + unstaged)
2. `code_touched` = any `.ts` file changed
3. `docs_touched` = any `.md` file or `docs/` path changed
4. If `code_touched` AND NOT `docs_touched` → emit reminder
5. Otherwise → emit `{}`

## Output

```json
{ "systemMessage": "TypeScript files changed but no docs updated. See memory/policies/07-documentation-and-traceability.md — check if tool names, env vars, or checkpoint behavior changed." }
```

Stateless. Does not edit files itself.

**Implementation:** `scripts/agentic/post_task_docs_sync.py`
