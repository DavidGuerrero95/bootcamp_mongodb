# Hook: subagent-stop-summary

**Trigger:** `SubagentStop`

**Contract:** Re-run orphan-process scan. Prompt the main agent to review the delegate's structured deliverable before proceeding.

## Behavior

1. Re-run orphan process scan (same logic as `session-end-orphan-check`)
2. Emit `systemMessage` prompting the orchestrator to:
   - Read the delegate's structured deliverable (Findings / Decisions / Risks / Open items / Validation)
   - Confirm the diff aligns with the summary
   - Decide if another delegate is needed or if the task is complete

## Output

```json
{
  "systemMessage": "Subagent completed. Review its structured deliverable: Findings / Decisions / Risks / Open items / Validation. Confirm the diff matches. Decide next step."
}
```

Does not block execution, auto-spawn agents, or edit files.

**Implementation:** `scripts/agentic/session_end_orphan_check.py` (shared implementation)
