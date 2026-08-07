# Test summary — unit-shell-auth-repos

## Runner
- Vitest (`npm test`)

## Coverage
- `mapProject` mapping
- `normalizeBaseUrl` https enforcement
- `sanitizeRememberedHint` property test (fast-check) — no password retained

## Not automated yet
- Full Electron e2e against real GitLab (manual smoke: `npm run dev`)
