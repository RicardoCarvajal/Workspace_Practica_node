# Unit of Work (Delta) — Chat RAG

## Units

### unit-chat-rag-lancedb (NEW — this construction cycle)
**Responsibilities**
- Mode select screen after repo open
- Workspace mode `chat` + ChatAnalysisPanel
- Bedrock Nova analysis chat (no edits)
- Titan embeddings + LanceDB per projectId
- Reindex on observations pull + cold start
- Convert assistant reply → observation draft
- In-memory chat session + token stats
- AWS config from `.env`
- Unit tests for chunking, token accumulate, citation shaping

**Code organization**
- Renderer: `src/views/ModeSelectPage.tsx`, `src/components/ChatAnalysisPanel.tsx`, App/Workspace wiring
- Main: `electron/services/rag-index-service.ts`, `bedrock-embeddings.ts`, refactor `bedrock-client.ts` for analysis-only, `chat-session-store.ts`
- Shared: `shared/ai-config.ts` (embedding model id), types for chat/RAG
- Deps: `@aws-sdk/client-bedrock-runtime`, `@lancedb/lancedb` (or apache-arrow as needed)

### Existing units (no rebuild)
- unit-shell-auth-repos — touch App navigation only
- unit-inception-viewer — reuse tree/preview
- observations panel — extend pull + append from chat

## Dependency

```text
unit-shell-auth-repos
  -> unit-chat-rag-lancedb (mode after openRepo)
unit-inception-viewer
  -> reused by both workspace modes
observations (FR-06)
  -> pull triggers reindex (chat unit)
  <- convert-to-observation calls append
```

## FR / acceptance map

| FR | Unit |
|---|---|
| FR-11 Mode menu | unit-chat-rag-lancedb |
| FR-12 Chat Nova RAG | unit-chat-rag-lancedb |
| FR-13 LanceDB + reindex | unit-chat-rag-lancedb (+ obs pull hook) |
| FR-14 AWS env | unit-chat-rag-lancedb |
| FR-06 pull side-effect | observations + rag hook |
