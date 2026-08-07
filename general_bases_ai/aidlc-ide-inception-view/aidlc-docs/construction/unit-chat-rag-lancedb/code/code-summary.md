# Code summary — unit-chat-rag-lancedb

## Delivered
- Mode select screen after opening a repo (Observaciones | Chat)
- Chat analysis with Amazon Nova Lite via Bedrock Converse (SigV4 HTTP; no hard AWS SDK dependency at runtime)
- Titan Embed Text v2 embeddings for RAG
- Embedded LanceDB-style store per `projectId` under Electron `userData/lancedb/{projectId}/`
- Reindex on observations pull and on demand from chat
- Convert assistant reply → observation draft
- In-memory chat session + token stats (last turn + session)
- AWS credentials from `.env` only

## Note on packages
- `optionalDependencies` lists `@aws-sdk/client-bedrock-runtime` and `@lancedb/lancedb` for future native LanceDB swap; current build uses embedded store + SigV4 client because npm registry was unreachable during generation.
