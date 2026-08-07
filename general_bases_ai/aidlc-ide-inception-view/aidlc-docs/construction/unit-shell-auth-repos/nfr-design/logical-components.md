# Logical Components — unit-shell-auth-repos

Essential set only (Q5=A).

## SessionStore (Main)
- Holds `Session` in memory
- `setCredentials`, `clear` (logout), `getAuthHeader`
- Never writes password to disk

## RememberedLoginStore (Main)
- Persists `{ baseUrl, username }` under Electron `userData`
- Load on app start for Login prefills
- Update after successful login

## GitLabApiClient (Main)
- `fetch` + Basic auth + 30s timeout + AbortSignal
- Methods: `getCurrentUser`, `listProjects({ page, search })`, `branchExists(projectId, 'dev')`
- Maps HTTP failures to AppError (generic for 401 on login)

## IpcFacade (Main + preload)
- Registers `aidlc:login`, `aidlc:logout`, `aidlc:list-repos`, `aidlc:open-repo`, `aidlc:get-remembered-login`
- Validates payloads before calling stores/client

## Renderer UI (logical)
- LoginPage / RepoListPage as designed in Functional Design
- Owns AbortController lifecycle for search; passes signal through IPC if needed (or Main aborts previous by request id)

## Interaction diagram (text)
```
LoginPage -> aidlc:login -> IpcFacade -> SessionStore + GitLabApiClient.getCurrentUser
                                      -> RememberedLoginStore.save
RepoListPage -> aidlc:list-repos -> IpcFacade -> GitLabApiClient.listProjects (AbortSignal)
RepoListPage -> aidlc:open-repo -> IpcFacade -> GitLabApiClient.branchExists('dev')
Logout -> aidlc:logout -> SessionStore.clear
```

## Mapping to Application Design components
| Logical | App Design |
|---|---|
| SessionStore | AuthSession |
| RememberedLoginStore | (support for AuthSession) |
| GitLabApiClient | GitLabService (subset for unit 1) |
| IpcFacade | preload bridge |
| Login/Repo UI | AppShell + RepoCatalog views |
