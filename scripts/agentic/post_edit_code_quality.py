#!/usr/bin/env python3
"""PostToolUse Edit/Write hook — emit quality reminders based on changed file type."""
import json, subprocess, sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.stdout.write("{}"); sys.exit(0)

tool_input = data.get("tool_input") or {}
file_path = tool_input.get("file_path", "") or tool_input.get("path", "")

messages = []

if file_path.endswith(".ts"):
    if "src/tools/" in file_path and file_path != "src/tools/registry.ts":
        messages.append(
            "New/edited tool file detected. Verify: "
            "(1) registered in src/tools/registry.ts → allTools, "
            "(2) added to src/patterns.ts → toolsForPattern()."
        )
    if "prompts/" in file_path:
        messages.append(
            "Prompt file edited. Verify: "
            "(1) CONSISTENT/INCONSISTENT/NEEDS REVIEW tokens present if hybrid prompt, "
            "(2) bilingual counterpart updated, "
            "(3) npm run verify CP2/CP3."
        )
    if "src/retrieval/" in file_path:
        messages.append(
            "Retrieval file edited. Verify embedding dimensions match vector index: "
            "VOYAGE_EMBEDDING_DIMENSIONS in .env must equal Atlas vector index dimension."
        )
    if "src/query/" in file_path:
        messages.append(
            "Query tool edited. Test with npm run dev and npm run verify CP2."
        )

if "data/sample/" in file_path:
    messages.append("Sample data edited. Run: npm run load && npm run verify")

if file_path == ".env":
    messages.append(
        "Warning: .env edited. Confirm it is NOT staged for commit: git status"
    )

if messages:
    sys.stdout.write(json.dumps({"systemMessage": " | ".join(messages)}))
else:
    sys.stdout.write("{}")
