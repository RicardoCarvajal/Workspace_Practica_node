# NFR Requirements — unit-inception-viewer

Inherited from unit-shell-auth-repos + FD decisions.

| Area | Decision |
|---|---|
| Latency | Up to 5s OK for tree/file/diff GETs |
| Concurrency | 1–10 desktop users |
| Stack | Electron + React + TypeScript |
| HTTP | Main-only; 30s timeout; AbortController cancel |
| Auth | Existing session (Basic / PRIVATE-TOKEN) |
| Drafts | Temp files under userData; clear on leave project / logout |
| Markdown | Lightweight sanitizing preview (no raw HTML exec) |
| PBT | Path validation invariants under inception |

## Tech stack
- React WorkspacePage + CSS
- GitLab Repository API (tree, files, commits, commit diff)
- fs for DraftFileStore
