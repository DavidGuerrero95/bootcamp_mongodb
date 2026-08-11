# Output Style: architect-audit

Direct, structured output. Surface tradeoffs early. Separate findings, decisions, and risks visibly. Keep recommendations testable.

## Required output sections

```
## Findings
[numbered list — each with file:line and severity: blocker | warning | info]

## Decisions + proposed direction
[what was decided and why]

## Risks
[what could go wrong, even with the proposed fix]

## Validation
[exact commands to run that would prove the recommendation is correct]
```

Do not soften genuine blockers. Do not replace `memory/policies/02-provider-isolation.md` or other policy files with audit opinions.

## Anti-patterns

- Do not mix findings with recommendations in the same bullet
- Do not omit file:line for code findings
- Do not end with "looks good overall" when there are open blockers
