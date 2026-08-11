#!/usr/bin/env python3
"""PreToolUse Edit/Write hook — deny if real secret patterns found in file content."""
import json, re, sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.stdout.write("{}"); sys.exit(0)

tool_input = data.get("tool_input") or {}
file_path = tool_input.get("file_path", "") or tool_input.get("path", "")
content = tool_input.get("content", "") or tool_input.get("new_string", "")

# Paths where placeholders are expected — warn only, don't deny
SAFE_PATH_SUFFIXES = (".env.example", ".test.ts", "data/sample/", "memory/")
is_safe_path = any(s in file_path for s in SAFE_PATH_SUFFIXES)

DENY_PATTERNS = [
    (r"AKIA[0-9A-Z]{16}", "AWS access key"),
    (r"al-[A-Za-z0-9]{32,}", "Voyage al- key"),
    (r"pa-[A-Za-z0-9]{32,}", "Voyage pa- key"),
    (r"sk-[A-Za-z0-9]{48}", "OpenAI API key"),
    (r"ghp_[A-Za-z0-9]{36}", "GitHub PAT"),
    (r"github_pat_[A-Za-z0-9_]{82}", "GitHub fine-grained PAT"),
    (r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----", "PEM private key"),
    (r"mongodb\+srv://[^:]+:[^@]+@", "MongoDB URI with embedded password"),
    (r"[0-9]{9,}:AA[A-Za-z0-9_-]{33}", "Telegram bot token"),
]

for pattern, label in DENY_PATTERNS:
    if re.search(pattern, content):
        if is_safe_path:
            sys.stdout.write(json.dumps({
                "systemMessage": f"Possible {label} detected in {file_path} — verify this is a placeholder, not a real secret."
            }))
        else:
            sys.stdout.write(json.dumps({
                "hookSpecificOutput": {
                    "permissionDecision": "deny",
                    "reason": f"Secret pattern detected: {label} in {file_path}"
                }
            }))
        sys.exit(0)

sys.stdout.write("{}")
