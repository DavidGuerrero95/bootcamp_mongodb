#!/usr/bin/env python3
"""SessionStart hook — remind agent to read /memory before non-trivial work."""
import json, sys

sys.stdout.write(json.dumps({
    "systemMessage": (
        "Canonical instructions are in /memory. "
        "Read /memory/README.md then /memory/MANIFEST.md before non-trivial work. "
        "Adapter folders (.claude/, .codex/, .cursor/, .agents/) are thin pointers only — "
        "never duplicate content into them."
    )
}))
