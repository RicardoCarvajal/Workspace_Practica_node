# Code Generation Plan — unit-logs-profile-edit

**Requirements**: FR-15, FR-16 (approved)  
**Execution plan**: `execution-plan-logs-profile-edit.md` (approved via "continua")  
**Workspace code root**: project root (never under `aidlc-docs/`)

## Unit context
- File logger under `logs/app.log` with truncate at ~400 KB
- Edit profile via click on topbar display name
- New observations slug → new file (existing service already uses current profile)

## Steps

- [x] Step 1: Add pure log helpers in `shared/file-log.ts` (+ unit tests)
- [x] Step 2: Add `electron/services/app-logger.ts` and init from `electron/main/index.ts`
- [x] Step 3: Wire info/warn/error logs into key IPC paths (`handlers.ts` bootstrap/login/logout/errors)
- [x] Step 4: Ensure `logs/` exists (`.gitkeep`); keep `*.log` gitignored
- [x] Step 5: Extend `ProfileSetupPage` for edit mode (prefill, cancel, copy)
- [x] Step 6: Make topbar name clickable in `App.tsx`; return to previous view after save/cancel
- [x] Step 7: CSS for clickable topbar name
- [x] Step 8: Construction summary under `aidlc-docs/construction/unit-logs-profile-edit/code/`
- [x] Step 9: Run unit tests

## Traceability
| FR | Steps |
|---|---|
| FR-15 | 1–4, 9 |
| FR-16 | 5–7, 9 |
