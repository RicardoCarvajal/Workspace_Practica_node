# Functional Design — unit-chat-rag-lancedb

## Domain

- **RagChunk**: `{ id, path, chunkIndex, text, vector }`
- **ChatTurn**: `{ role: user|assistant, content, citations?, usage? }`
- **TokenUsage**: `{ inputTokens, outputTokens, totalTokens }`
- **ChatSession**: `{ projectId, messages[], lastUsage, sessionUsage }`

## Rules

1. Index only `.md` under `aidlc-docs/inception/` except `.../observaciones/**`.
2. Chunk by headings (`##`) then split >1200 chars with 100 overlap.
3. Chat answers only from retrieved chunks + session history; cite paths.
4. No FileEdit / no inception writes from chat.
5. Convert observation = append assistant text via existing observations append.
6. Session in-memory per projectId until process exit.
7. Pull observations success → full reindex for that projectId.

## Plan
- [x] Domain models
- [x] Chunking / retrieval rules
- [x] Chat turn / convert / reindex flows
