# Skill: prompt-engineering

Workflow for writing and improving system prompts for the three agent patterns.

## Steps

1. **Identify failing behavior** — which pattern? what symptom? (ungrounded / wrong tool / no citation / wrong language)
2. **Read current prompt** — `src/agent/prompts/en.ts` for the affected pattern
3. **Diagnose root cause** — missing instruction, ambiguous instruction, or conflicting instructions?
4. **Apply smallest fix** — add one concrete sentence rather than rewriting the whole prompt
5. **Verify bilingual parity** — if `en.ts` changed, update `es.ts` in the same commit
6. **Verify verdict tokens** — if hybrid prompt touched, confirm `CONSISTENT/INCONSISTENT/NEEDS REVIEW` present
7. **Validate** — `npm run typecheck` + `npm run verify` for affected checkpoint tier

## Prompt anatomy (shared base)

Every pattern prompt should include:
- Agent role/persona (one sentence)
- "Use the tools provided; do not answer from prior knowledge when a tool can get the facts"
- "Be concise and specific"
- Pattern-specific citation instruction (cite source for RAG, explain pipeline for structured)
- "If the tools cannot answer, say so plainly"

## Pattern-specific additions

**RAG:** "When you use retrieved passages, cite them by their source filename and section."

**Structured:** "When you report numbers, state what query produced them and include the explanation."

**Hybrid:** "Use knowledge_base_search for policy questions, structured_query for record questions, and assess to judge a specific record against policy. Report both the evidence from records and the relevant policy passage."

## Bilingual rules

- Translate only prose
- Keep in English: tool names, field names, enum values, verdict tokens, JSON keys, file paths
- Verdict tokens `CONSISTENT`, `INCONSISTENT`, `NEEDS REVIEW` must appear verbatim in `es.ts` too

## Red flags in prompts

- Instructions that could loop (e.g. "always call assess") without a termination condition
- Ambiguous tool selection criteria (e.g. "use whichever tool seems best")
- Instructions that contradict each other across the shared base and pattern-specific sections
