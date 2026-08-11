#!/usr/bin/env python3
"""Stop hook — remind to update docs if TypeScript changed but no markdown was touched."""
import json, subprocess, sys

try:
    result = subprocess.run(
        ["git", "diff", "--name-only", "HEAD"],
        capture_output=True, text=True, timeout=10,
        cwd="/root/bootcamp"
    )
    changed = result.stdout.splitlines()
except Exception:
    sys.stdout.write("{}"); sys.exit(0)

code_touched = any(f.endswith(".ts") and not f.endswith(".d.ts") for f in changed)
docs_touched = any(f.endswith(".md") or f.startswith("docs/") for f in changed)

if code_touched and not docs_touched:
    sys.stdout.write(json.dumps({
        "systemMessage": (
            "TypeScript files changed but no documentation updated. "
            "See memory/policies/07-documentation-and-traceability.md — "
            "check if tool names, env vars, or checkpoint behavior changed and need doc updates."
        )
    }))
else:
    sys.stdout.write("{}")
