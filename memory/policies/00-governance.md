# Policy 00 — Memory Governance

`/memory` is the only source of truth for agent operation. Adapter folders (`.claude/`, `.codex/`, `.cursor/`, `.agents/`) reference only — they never store policy, rules, or skill logic.

## Anti-duplication rule

An adapter file that contains more than 5 lines of original content is a violation. Shrink it to a pointer. The canonical content lives in `/memory`.

## Adding a new file

A new `/memory` file requires all four justifications:
1. **Distinct trigger** — names the event or input that activates it
2. **Distinct responsibility** — does not restate what an existing file already owns
3. **No merge candidate** — cannot be folded into an existing file without ambiguity
4. **Scoping question answered** — is it a policy (invariant), rule (flow), skill (procedure), agent (persona), hook (lifecycle), command (entrypoint), or output style (tone)?

## Change control

1. Identify the canonical owner file in `MANIFEST.md`
2. Update only that file
3. Update `MANIFEST.md` if the concern map changes
4. Verify adapter files remain thin pointers (no copied content)

## Precedence ladder

```
platform safety → policies → rules → skills/agents → output-styles → ad hoc prompt → adapter folders
```

Higher levels override lower levels. No adapter folder may override a policy.
