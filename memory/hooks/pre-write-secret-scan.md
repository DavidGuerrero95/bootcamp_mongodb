# Hook: pre-write-secret-scan

**Trigger:** `PreToolUse` — Edit | Write

**Contract:** Scan file content about to be written for secrets. Deny if a real secret is found.

## Deny patterns

| Pattern | Regex |
|---|---|
| AWS access key | `AKIA[0-9A-Z]{16}` |
| Voyage/al- key | `al-[A-Za-z0-9]{32,}` |
| Voyage/pa- key | `pa-[A-Za-z0-9]{32,}` |
| OpenAI key | `sk-[A-Za-z0-9]{48}` |
| GitHub PAT | `ghp_[A-Za-z0-9]{36}` or `github_pat_` |
| PEM private key | `-----BEGIN.*PRIVATE KEY-----` |
| MongoDB URI with password | `mongodb\+srv://[^:]+:[^@]+@` |
| Telegram bot token | `[0-9]{9,}:AA[A-Za-z0-9_-]{33}` |

## Placeholder-safe paths (warn only, don't deny)

- `.env.example` (placeholders expected)
- Files in `data/sample/` (synthetic data)
- `*.test.ts` files
- `memory/` documentation files

## Output

```json
{ "hookSpecificOutput": { "permissionDecision": "deny", "reason": "Secret pattern detected: <type>" } }
```
or `{ "systemMessage": "Possible secret detected in <path> — verify this is a placeholder." }` or `{}`

**Implementation:** `scripts/agentic/pre_write_secret_scan.py`
