# Hook: prompt-memory-reminder

**Trigger:** `SessionStart`

**Contract:** Emit a single `systemMessage` pointing at `/memory/README.md` and `/memory/MANIFEST.md` as the canonical instruction sources.

**Behavior:** Stateless. Always emits the same reminder at session start. Does not read any state.

**Output:**
```json
{
  "systemMessage": "Canonical instructions are in /memory. Read /memory/README.md then /memory/MANIFEST.md before non-trivial work. Adapter folders (.claude/, .codex/) are thin pointers only."
}
```

**Implementation:** `scripts/agentic/prompt_memory_reminder.py`
