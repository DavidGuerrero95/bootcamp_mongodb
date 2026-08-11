#!/usr/bin/env python3
"""PreToolUse Bash hook — deny or warn on destructive shell commands."""
import json, re, sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.stdout.write("{}"); sys.exit(0)

command = (data.get("tool_input") or {}).get("command", "")

DENY_PATTERNS = [
    (r"rm\s+-rf\s+/(?!tmp)", "rm -rf / outside /tmp is not allowed"),
    (r"rm\s+-rf\s+\.", "rm -rf . at repo root is not allowed"),
    (r"git\s+push\s+--force\s+.*(?:main|master)", "force push to main/master is not allowed"),
    (r"DROP\s+DATABASE", "DROP DATABASE requires explicit user confirmation"),
    (r"deleteMany\(\s*\{\s*\}\s*\)", "deleteMany({}) without filter wipes entire collection"),
]

WARN_PATTERNS = [
    (r"git\s+reset\s+--hard", "git reset --hard discards all local changes"),
    (r"git\s+clean\s+-fd", "git clean -fd removes untracked files"),
    (r"git\s+checkout\s+\.", "git checkout . discards working tree changes"),
    (r"rm\s+-rf", "rm -rf — verify the target path before proceeding"),
]

for pattern, reason in DENY_PATTERNS:
    if re.search(pattern, command, re.IGNORECASE):
        sys.stdout.write(json.dumps({
            "hookSpecificOutput": {
                "permissionDecision": "deny",
                "reason": reason
            }
        }))
        sys.exit(0)

for pattern, warning in WARN_PATTERNS:
    if re.search(pattern, command, re.IGNORECASE):
        sys.stdout.write(json.dumps({
            "systemMessage": f"Warning: {warning}. Confirm with user before proceeding."
        }))
        sys.exit(0)

sys.stdout.write("{}")
