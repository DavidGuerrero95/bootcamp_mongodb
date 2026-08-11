# MANIFEST.md — one owner per concern

## Policies (00–07)

| File | Owner concern |
|---|---|
| `00-governance.md` | Memory architecture, anti-duplication |
| `01-engineering-baseline.md` | TypeScript stack invariants |
| `02-provider-isolation.md` | LLM provider access contract |
| `03-langgraph-and-tools.md` | Agent graph, tool registration, memory discipline |
| `04-testing-and-quality-gates.md` | typecheck, verify, test standards |
| `05-security-and-secrets.md` | Secrets, destructive commands, supply chain |
| `06-bootcamp-domain-guardrails.md` | Extension points, checkpoint requirements, data compliance |
| `07-documentation-and-traceability.md` | Bilingual docs, CLAUDE.md, HOW-TO-USE.md |

## Rules (00–05)

| File | Owner concern |
|---|---|
| `00-project-baseline.md` | Working mode: Inspect → Change → Validate → Summarize |
| `01-task-execution-flow.md` | 8-step task sequence |
| `02-validation-and-done-definition.md` | Definition of done per checkpoint tier |
| `03-subagent-delegation.md` | When and how to delegate to specialized agents |
| `04-memory-discipline.md` | Store/recall rules, reference discipline |
| `05-checkpoint-verification.md` | How to gate progress by checkpoint |

## Skills

| Skill | SKILL.md location |
|---|---|
| `typescript-tool-development` | `skills/typescript-tool-development/SKILL.md` |
| `mongodb-pipeline-engineering` | `skills/mongodb-pipeline-engineering/SKILL.md` |
| `retrieval-tuning` | `skills/retrieval-tuning/SKILL.md` |
| `langgraph-agent-debugging` | `skills/langgraph-agent-debugging/SKILL.md` |
| `bootcamp-checkpoint-runner` | `skills/bootcamp-checkpoint-runner/SKILL.md` |
| `prompt-engineering` | `skills/prompt-engineering/SKILL.md` |

## Agents

11 agents: `code-reviewer`, `mongo-pipeline`, `typescript-engineer`, `bootcamp-guide`, `security-reviewer`, `technical-writer`, `debug-investigator`, `retrieval-tuner`, `prompt-engineer`, `memory-architect`, `checkpoint-verifier`.

## Hooks (7)

`prompt-memory-reminder` (SessionStart), `pre-bash-safety-guard` (PreToolUse Bash), `pre-write-secret-scan` (PreToolUse Edit/Write), `post-edit-code-quality` (PostToolUse Edit/Write), `post-task-docs-sync` (Stop), `session-end-orphan-check` (Stop/SessionEnd/SubagentStop), `subagent-stop-summary` (SubagentStop).

## Commands (8)

`implement-tool`, `review-changes`, `verify-checkpoints`, `load-data`, `debug-retrieval`, `tune-prompts`, `sync-documentation`, `add-memory`.

## Output styles (4)

`architect-audit`, `bootcamp-guide`, `terse-caveman`, `incident-responder`.

## Anti-duplication rules

- Policies hold invariants, not procedures.
- Skills hold procedures, not policy redeclarations.
- Agents link to skills and contain no workflow.
- Output styles affect tone only.
- Adapter folders are thin pointers. If an adapter file contains more than 5 lines of original content, it is a duplication violation.
