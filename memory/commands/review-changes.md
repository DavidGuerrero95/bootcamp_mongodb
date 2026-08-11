# Command: /review-changes

**When to use:** Structured review of the current git diff before commit or demo.

## Review axes

1. **Provider isolation** — no SDK imports outside `src/llm/model.ts`
2. **Tool registration** — new tools in registry + pattern
3. **Memory discipline** — `remember` stores only references, not raw data
4. **Security/secrets** — no hardcoded keys, no real data
5. **TypeScript correctness** — strict mode violations, missing types
6. **Bilingual consistency** — identifiers in English in both `en.ts` and `es.ts`
7. **Verdict tokens** — `CONSISTENT/INCONSISTENT/NEEDS REVIEW` verbatim in hybrid prompts
8. **Documentation** — docs updated if tool names or checkpoint behavior changed

## Delegates

- `code-reviewer` (lead)
- `security-reviewer` (axes 4)
- `technical-writer` (axis 8)

## Output format

```
[PASS/FAIL] Axis N — description (file:line if fail)
```

Require all axes to pass before merge. No "overall looks good" shortcut.
