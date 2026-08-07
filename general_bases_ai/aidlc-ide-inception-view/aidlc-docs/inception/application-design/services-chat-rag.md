# Services (Delta) — Chat RAG orchestration

## OpenRepoFlow
1. `openRepo` (existing) validates inception on `dev`.
2. Navigate to **ModeSelectPage** (not straight to workspace).
3. User picks mode → Workspace with `workspaceMode`.

## ChatTurnFlow
1. Ensure profile + AWS env present.
2. If LanceDB empty/missing → fetch inception MD (excl. observaciones) from GitLab `dev` → embed → upsert LanceDB.
3. Embed user query → retrieve top-k chunks.
4. Call Nova Converse with history + chunks; forbid edits.
5. Append to ChatSessionStore; return message, citations, usage.

## PullAndReindexFlow
1. Existing observations pull from `dev`.
2. List/fetch inception MD blobs (excl. observaciones).
3. Full reindex LanceDB for `projectId`.
4. Return pull result + index stats to UI.

## ConvertToObservationFlow
1. Take assistant message text.
2. `appendObservation` into user observations draft.
3. Confirm in UI; no push.
