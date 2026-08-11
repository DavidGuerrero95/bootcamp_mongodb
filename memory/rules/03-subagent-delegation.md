# Rule 03 — Subagent Delegation

## Delegate when

- The task benefits from a distinct specialized role (e.g., pipeline generation vs. code review)
- Narrower context improves output quality (e.g., only the schema and the question)
- Independent review adds value (e.g., adversarial check of a pipeline before running it)
- Parallel inspection reduces total time

## Delegation matrix

| Task shape | Recommended agent |
|---|---|
| Generate MongoDB aggregation pipeline | `mongo-pipeline` |
| Review TypeScript diff for invariant violations | `code-reviewer` |
| Implement a new tool file | `typescript-engineer` |
| Debug retrieval quality issues | `retrieval-tuner` |
| Debug LangGraph loop or tool-call failures | `debug-investigator` |
| Write or improve system prompts | `prompt-engineer` |
| Design memory keys and structure | `memory-architect` |
| Security audit before commit | `security-reviewer` |
| Keep bilingual docs in sync | `technical-writer` |
| Verify checkpoint status | `checkpoint-verifier` |
| Guide through bootcamp phases | `bootcamp-guide` |

## Boundaries

- Minimum delegates — don't spawn a subagent for a 2-line change
- No recursive delegation — a delegate does not spawn further delegates
- Brief the delegate completely — include the relevant schema, the question, and any constraints
- Do not delegate understanding — the orchestrator synthesizes findings, not the delegate

## Deliverable format from delegates

```
Findings / Decisions / Risks / Open items / Validation
```
