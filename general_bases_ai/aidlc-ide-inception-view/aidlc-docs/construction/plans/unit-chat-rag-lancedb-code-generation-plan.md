# Code Generation Plan — unit-chat-rag-lancedb

- [x] Add optional deps note (npm registry unavailable; SigV4 + embedded Lance store)
- [x] shared: ai-config embeddings, rag-chunk, chat types, IPC
- [x] electron: aws config, embeddings, rag-index, analysis chat, session store, lancedb store
- [x] IPC handlers + preload
- [x] ModeSelectPage, ChatAnalysisPanel, App/Workspace mode wiring
- [x] observations pull → reindex hook
- [x] .env.example AWS vars
- [x] unit tests chunking + tokens
- [x] code summary under aidlc-docs/construction/.../code/
