# Code Generation Plan — unit-shell-auth-repos

**Unit**: unit-shell-auth-repos  
**Stories**: US-01, US-02, US-03, US-04  
**Workspace root**: `/home/rcarvajal/workspaces/workspace_work/aidlc-ide-inception-view`  
**Code location**: workspace root (`electron/`, `src/`, `shared/`, `tests/`) — NEVER under `aidlc-docs/`  
**Docs summaries**: `aidlc-docs/construction/unit-shell-auth-repos/code/`

## Context
- Greenfield Electron monolith (logical units)
- Stack: Electron + React + TypeScript; `fetch` in Main; IPC `aidlc:*`
- Dependencies: none (first unit)
- Interfaces: SessionStore, RememberedLoginStore, GitLabApiClient, IpcFacade, LoginPage, RepoListPage

## Story checklist
- [x] US-01 Iniciar sesion
- [x] US-02 Cerrar sesion
- [x] US-03 Listar repos (paginacion + busqueda servidor)
- [x] US-04 Abrir solo si existe rama `dev`

---

## Generation steps

### Step 1 — Project structure setup (greenfield scaffold)
- [x] Create root `package.json` (Electron + React + TS + Vite or electron-vite)
- [x] Create `tsconfig.json` / `tsconfig.node.json` as needed
- [x] Create folders: `electron/main`, `electron/preload`, `electron/services`, `electron/ipc`, `electron/stores`, `src/`, `shared/`, `tests/unit/`, `build/`
- [x] Add `.env.example` placeholder (no secrets; Gemini later)
- [x] Add `.gitignore` (node_modules, dist, .env, out)

### Step 2 — Shared types and IPC contracts
- [x] `shared/types.ts` — Session, RepoSummary, RepoListPage, AppError, RememberedLoginHint
- [x] `shared/ipc-channels.ts` — `aidlc:login`, `aidlc:logout`, `aidlc:list-repos`, `aidlc:open-repo`, `aidlc:get-remembered-login`
- [x] `shared/errors.ts` — helpers to build AppError without secrets

### Step 3 — Business logic / stores (Main)
- [x] `electron/stores/session-store.ts` — in-memory session; clear on logout
- [x] `electron/stores/remembered-login-store.ts` — persist username+baseUrl in userData
- [x] Unit tests: session invariants (no password on disk path)

### Step 4 — GitLab API client (Main)
- [x] `electron/services/gitlab-api-client.ts` — fetch + Basic auth + 30s timeout + AbortSignal
- [x] Methods: getCurrentUser, listProjects({page, search, signal}), branchExists(projectId, 'dev', signal)
- [x] Map 401 on login to generic Spanish AppError
- [x] Unit tests with mocked fetch

### Step 5 — IPC layer
- [x] `electron/preload/index.ts` — contextBridge expose `window.aidlcApi`
- [x] `electron/ipc/handlers.ts` — register handlers for all `aidlc:*` channels; validate inputs
- [x] `electron/main/index.ts` — BrowserWindow, load renderer, wire handlers, secure defaults (contextIsolation, no nodeIntegration)

### Step 6 — Frontend (Renderer)
- [x] Vite React TS app under `src/`
- [x] `src/App.tsx` — route Login vs RepoList
- [x] `src/views/LoginPage.tsx` + form with `data-testid`s
- [x] `src/views/RepoListPage.tsx` — search, list, load more, open repo, logout
- [x] Debounced search + AbortController on query change
- [x] Minimal CSS / Tailwind setup

### Step 7 — Unit tests (renderer helpers / mapping)
- [x] Tests for RepoSummary mapping / error helpers as pure functions
- [x] Add `fast-check` tests for P-AUTH-2 style invariants on RememberedLoginHint shape (no password field)

### Step 8 — Documentation summaries
- [x] `aidlc-docs/construction/unit-shell-auth-repos/code/code-summary.md`
- [x] `aidlc-docs/construction/unit-shell-auth-repos/code/test-summary.md`
- [x] Root `README.md` with how to run (`npm install`, `npm run dev`)

### Step 9 — Smoke config
- [x] Scripts in package.json: `dev`, `build`, `test`
- [x] Ensure app boots to Login screen (manual smoke noted in summary)

---

## Out of scope (later units)
- Inception file tree / Markdown / recent diff
- Gemini / drafts / MR
- electron-builder installers

## Approval
Review this plan. Reply **apruebo** / **continua** to start Part 2 generation, or request changes.
