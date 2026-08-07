# Code summary — unit-shell-auth-repos

## Created (application code at workspace root)

### Scaffold
- `package.json`, `tsconfig.json`, `electron.vite.config.ts`, `vitest.config.ts`, `.gitignore`, `.env.example`, `README.md`

### shared/
- `types.ts`, `ipc-channels.ts`, `errors.ts`

### electron/
- `main/index.ts` — BrowserWindow + secure defaults
- `preload/index.ts` — `window.aidlcApi` bridge
- `ipc/handlers.ts` — `aidlc:*` handlers
- `stores/session-store.ts` — in-memory session
- `stores/remembered-login-store.ts` — username/baseUrl in userData
- `services/gitlab-api-client.ts` — fetch GitLab API (30s timeout)

### src/
- `App.tsx`, `main.tsx`, `index.html`, `index.css`
- `views/LoginPage.tsx`, `views/RepoListPage.tsx`

## Stories covered
- US-01 login
- US-02 logout
- US-03 list/search/pagination
- US-04 open requires branch `dev`
