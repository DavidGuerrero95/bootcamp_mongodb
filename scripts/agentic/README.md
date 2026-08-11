# scripts/agentic — Hook Implementations

Lightweight, stateless Python scripts that implement the hook contracts defined in `/memory/hooks/`.

All scripts read JSON from stdin, write JSON to stdout.

| Script | Hook | Trigger |
|---|---|---|
| `prompt_memory_reminder.py` | `prompt-memory-reminder` | SessionStart |
| `pre_bash_safety_guard.py` | `pre-bash-safety-guard` | PreToolUse Bash |
| `pre_write_secret_scan.py` | `pre-write-secret-scan` | PreToolUse Edit/Write |
| `post_edit_code_quality.py` | `post-edit-code-quality` | PostToolUse Edit/Write |
| `post_task_docs_sync.py` | `post-task-docs-sync` | Stop |
| `session_end_orphan_check.py` | `session-end-orphan-check` | Stop/SessionEnd/SubagentStop |

## Smoke test

```bash
echo '{}' | python3 scripts/agentic/prompt_memory_reminder.py
echo '{"tool_input": {"command": "ls"}}' | python3 scripts/agentic/pre_bash_safety_guard.py
```

Scripts are best-effort helpers, not perfect enforcement. They emit guidance; they do not replace policy review.
