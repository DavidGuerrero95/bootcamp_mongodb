# Command: /sync-documentation

**When to use:** Docs are out of sync with the current implementation.

## Steps

1. Audit implementation — `git diff` to see what changed
2. Identify affected documentation surfaces (see `policies/07-documentation-and-traceability.md`)
3. Update narrowest surface first:
   - Tool name or description changed → update `README.md` tool table
   - New env var → update `.env.example` + `README.md`
   - Checkpoint behavior changed → update `HOW-TO-USE.md` + `HOW-TO-USE.es.md`
   - New pattern added → update `context.md` and `README.md`
   - New memory key → update `context.md`
4. Verify bilingual parity — English and Spanish versions equivalent
5. Validate by reading the docs as an operator would

## Delegate: `technical-writer`

For large documentation sync (multiple surfaces changed), delegate to `technical-writer` with a list of changed files and their effects.

## Output

List of updated doc files + confirmation that bilingual parity maintained.
