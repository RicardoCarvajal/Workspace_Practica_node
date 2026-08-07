# Code summary — unit-inception-viewer

## Delivered
- Workspace screen after Abrir (tree left / file right)
- GitLab tree + file + recent commit diff on `dev`
- Path guard: only `aidlc-docs/inception/**`
- Markdown Preview | Texto tabs; manual drafts in userData temp
- Modal Cambios recientes; Volver limpia borradores del proyecto

## Key paths
- `src/views/WorkspacePage.tsx`, `src/components/InceptionTree.tsx`
- `electron/services/gitlab-api-client.ts` (listTree, getFileContent, getFileRecentDiff)
- `electron/stores/draft-file-store.ts`
- `shared/path-guard.ts`
