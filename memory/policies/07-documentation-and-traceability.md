# Policy 07 — Documentation and Traceability

## Documentation surfaces

| Surface | Location | Update trigger |
|---|---|---|
| Project instructions | `CLAUDE.md` | Architecture change, new invariant, new extension point |
| Phase-by-phase guide | `HOW-TO-USE.md` + `HOW-TO-USE.es.md` | Phase scope change, new npm script, checkpoint change |
| Architecture and data model | `context.md` + `README.md` | Collection schema change, new pattern, new tool |
| Prompt catalog | `prompts/en/` + `prompts/es/` | Phase prompt change |
| Agent memory foundation | `memory/` | New policy, rule, skill, agent, hook, command |
| Env var template | `.env.example` | New config var added or removed |

## Bilingual rule

Every participant-facing documentation file has an English and a Spanish version. Change one → update the other. Identifiers, type names, file paths, collection names, env var names, shell commands, npm scripts, MongoDB stage names, and JSON keys are never translated.

## Verdict token traceability

`CONSISTENT`, `INCONSISTENT`, and `NEEDS REVIEW` are matched by `scripts/verify.ts`. They must appear verbatim in:
- `src/hybrid/prompts/en.ts`
- `src/hybrid/prompts/es.ts`

Any rename silently breaks Checkpoint 3 verification.

## Memory foundation traceability

When adding a new memory file to `/memory`:
1. Update `MANIFEST.md` with the new entry
2. Add a thin pointer in the appropriate adapter folder
3. Update `scripts/agentic/` hooks if lifecycle behavior changes
4. Verify adapter files contain no copied content

## Update in the same changeset

Any change to tool names, collection names, env var names, checkpoint requirements, or the verify script must be paired with documentation updates in the same commit.
