# Policy 05 — Security and Secrets

## Never hardcode secrets

No API keys, passwords, connection strings with credentials, or tokens anywhere in source, tests, comments, logs, or documentation. Templates belong in `.env.example` only, with placeholder values.

## Credential bootstrap

AWS credentials and `VOYAGE_API_KEY` are minted at runtime by `src/credentials.ts` via a DevDay Lambda (`LAMBDA_CREDENTIALS_URL` + `PASSKEY`). They are never written to disk. If you need to provide your own keys, set them in `.env` under the commented-out section — never commit a `.env` with real values.

## Secret patterns to scan before any commit

- AWS keys: `AKIA[0-9A-Z]{16}`
- Voyage/OpenAI keys: `pa-`, `al-`, `sk-`
- GitHub PATs: `ghp_`, `github_pat_`
- PEM private keys: `-----BEGIN.*PRIVATE KEY-----`
- MongoDB URI with password: `mongodb\+srv://[^:]+:[^@]+@`
- Telegram bot tokens: `[0-9]+:AA[A-Za-z0-9_-]{33}`

## Destructive commands requiring explicit user confirmation

- `rm -rf` outside `/tmp`
- `git push --force` on shared branches
- `git reset --hard` / `git clean -fd` / `git checkout .`
- `DROP DATABASE` / `TRUNCATE` on non-test collections
- Bulk wildcard deletions in MongoDB (`deleteMany({})` without a filter)

The `pre-bash-safety-guard` hook denies the worst cases automatically.

## Supply chain

- New dependencies require: rationale, trusted source check, licence check, pinned version
- No range versions (`^` is fine for patch, `*` is never acceptable for major)
- Never add a provider SDK (OpenAI, Anthropic direct, etc.) as a dependency

## Logging

Never log secrets, full connection strings, or user-identifiable data in any output visible in source or CI logs.
