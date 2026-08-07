# Code summary — unit-logs-profile-edit

## Created
- `shared/file-log.ts` — truncate threshold (400 KB), format line, sanitize meta
- `electron/services/app-logger.ts` — write `logs/app.log` under `process.cwd()`
- `logs/.gitkeep` — keep directory; `*.log` remains gitignored
- `tests/unit/file-log.test.ts`

## Modified
- `electron/main/index.ts` — `initAppLogger()` on ready
- `electron/ipc/handlers.ts` — info/warn/error on profile, login, logout, openRepo, pull, chat
- `src/views/ProfileSetupPage.tsx` — modes `setup` | `edit` with cancel
- `src/App.tsx` — clickable topbar name opens edit form
- `src/index.css` — `.topbar-display-name`, `.profile-setup-actions`

## Behavior notes
- Log truncate: wipe file when size >= 400 KB before append
- Profile slug change: observations service already uses current profile path → new empty/remote file; old file untouched
- GitLab rename: deferred to normal observations push/close (FR-16 Q6=A)
