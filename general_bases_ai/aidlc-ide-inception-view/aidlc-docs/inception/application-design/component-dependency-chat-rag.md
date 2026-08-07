# Component Dependency (Delta) — Chat RAG

```text
ModeSelectPage
  -> WorkspaceShell (observations | chat)

WorkspaceShell
  -> InceptionTree / Preview (reuse)
  -> ObservationsPanel (mode observations)
  -> ChatAnalysisPanel (mode chat)

ChatAnalysisPanel
  -> IPC -> ChatSessionStore
  -> IPC -> BedrockChatService
  -> IPC -> RagIndexService
  -> IPC -> ObservationsService.append

ObservationsPanel
  -> IPC -> ObservationsService.pull
       -> RagIndexService.reindex

BedrockChatService
  -> AWS Bedrock Runtime (Nova)
  -> RagIndexService.query (pre-turn)

RagIndexService
  -> AWS Bedrock Runtime (Titan embeddings)
  -> LanceDB (userData/lancedb/{projectId})
  -> GitLab API (file list/content for index build)
```

**Coupling rules**
- Renderer never holds AWS keys or LanceDB handles.
- Chat cannot call draft/save on inception files.
- Reindex is side-effect of pull and of first chat open if empty.
