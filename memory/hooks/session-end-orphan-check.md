# Hook: session-end-orphan-check

**Trigger:** `Stop` | `SessionEnd` | `SubagentStop`

**Contract:** Scan running processes for agent-related processes that may have been left running. Report count and samples. Never kills processes.

## Behavior

1. List all processes with `ps -eo pid=,command=`
2. Filter for `claude`, `codex`, `tsx` (case-insensitive), excluding current PID
3. If any found: emit `systemMessage` with count and up to 3 sample command lines (truncated at 120 chars)
4. If none found: emit `{}`

## Output

```json
{ "systemMessage": "2 possible orphan process(es) found: [12345] tsx src/index.ts ..." }
```

Stateless. Informational only.

**Implementation:** `scripts/agentic/session_end_orphan_check.py`
