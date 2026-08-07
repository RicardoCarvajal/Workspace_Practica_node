# Unit of Work Dependencies

## Build / development sequence

```
unit-shell-auth-repos
        |
        v
unit-inception-viewer
        |
        v
unit-gemini-publish
        |
        v
unit-packaging
```

## Dependency matrix

| Unit | Depends on | Reason |
|---|---|---|
| unit-shell-auth-repos | — | Foundation |
| unit-inception-viewer | unit-shell-auth-repos | Needs auth + selected project + IPC patterns |
| unit-gemini-publish | unit-shell-auth-repos, unit-inception-viewer | Needs session + file context for edits/publish |
| unit-packaging | unit-shell-auth-repos (+ ideally 2 and/or 3) | Needs app entrypoints to package |

## Shared coupling
- All runtime units use `shared/` (IPC `aidlc:*`, AppError types)
- GitLabService grows across units 1→3 (read then write)
- DraftFileStore introduced in unit 3

## Parallelization
- Per approved plan: **no parallelization** — single sequential owner
- Optional later: packaging docs/CI can start late in parallel with unit 3 polish

## Text alternative
1. Build shell+auth+repos
2. Then inception viewer on top
3. Then Gemini+publish
4. Then package installers
