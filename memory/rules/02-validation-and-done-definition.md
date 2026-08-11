# Rule 02 — Validation and Definition of Done

## Definition of done

A task is done when all of the following are true:
- `npm run typecheck` exits with zero errors
- `npm run verify` passes all checks for the affected checkpoint tier(s)
- No secrets or real data in any committed file
- Documentation updated if tool names, env vars, or checkpoint behavior changed
- Summary states exact commands run and their outcome

## Validation ladder

| Task type | Required validation |
|---|---|
| TypeScript-only edit | `npm run typecheck` |
| New tool (no data change) | typecheck + `npm run dev` manual invocation |
| Data schema change | `npm run load` + `npm run verify` |
| Prompt change | typecheck + `npm run verify` (CP2 and/or CP3) |
| Memory tool or store change | typecheck + `npm run verify` CP3 |
| New pattern or tool set | typecheck + full `npm run verify` |
| Pre-commit | typecheck + full `npm run verify` |

## Reporting format

After validation, report using this structure:
```
[ran]  npm run typecheck — clean
[ran]  npm run verify — CP1 ✓, CP2 ✓, CP3 ✓
[skip] manual E2E — not affected by this change
```

State `[skip]` with a reason for anything not run. Never omit validation silently.
