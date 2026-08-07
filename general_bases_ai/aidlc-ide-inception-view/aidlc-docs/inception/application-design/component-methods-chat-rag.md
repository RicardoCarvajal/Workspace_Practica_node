# Component Methods (Delta) — Chat RAG

## ModeSelectPage
- `onChooseObservations(ctx)` → workspace mode observations
- `onChooseChat(ctx)` → workspace mode chat
- `onBack()` → repo list

## ChatAnalysisPanel
- `loadSession(projectId)`
- `sendMessage(text)` → IPC chatTurn
- `convertToObservation(assistantText)` → IPC observationsAppend
- `showTokenStats(last, session)`

## ChatSessionStore
- `getSession(projectId): ChatSession`
- `appendTurn(projectId, user, assistant, usage)`
- `clearAll()` on app quit (implicit process end)

## RagIndexService
- `reindex(projectId, files: {path, content}[]): Promise<{chunks: number}>`
- `query(projectId, query: string, topK: number): Promise<RagChunk[]>`
- `indexExists(projectId): boolean`

## BedrockChatService
- `chat(opts: { projectId, messages, retrievedChunks, openPath? }): Promise<{ message, citations, usage }>`

## ObservationsService (extend)
- `pullObservations(...)` → after success, `reindex` for project
- existing `appendObservation` used by convert button
