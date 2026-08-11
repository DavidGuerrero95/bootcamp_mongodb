#!/usr/bin/env python3
"""Stop/SessionEnd/SubagentStop hook — scan for orphan agent processes."""
import json, os, subprocess, sys

try:
    result = subprocess.run(
        ["ps", "-eo", "pid=,command="],
        capture_output=True, text=True, timeout=10
    )
    lines = result.stdout.splitlines()
except Exception:
    sys.stdout.write("{}"); sys.exit(0)

current_pid = os.getpid()
KEYWORDS = ["claude", "codex", "tsx src/index"]

orphans = []
for line in lines:
    parts = line.strip().split(None, 1)
    if len(parts) < 2:
        continue
    try:
        pid = int(parts[0])
    except ValueError:
        continue
    cmd = parts[1]
    if pid == current_pid:
        continue
    if any(k.lower() in cmd.lower() for k in KEYWORDS):
        orphans.append(f"[{pid}] {cmd[:120]}")

if orphans:
    sample = orphans[:3]
    sys.stdout.write(json.dumps({
        "systemMessage": (
            f"{len(orphans)} possible orphan process(es) found: "
            + "; ".join(sample)
            + ". Review before starting a new session."
        )
    }))
else:
    sys.stdout.write("{}")
