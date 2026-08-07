# Intent Analysis — Menu post-repo + Chat Nova (RAG / LanceDB)

**Timestamp**: 2026-08-03T13:04:00Z  
**Request type**: New Feature / Enhancement (reintroduce AI chat with RAG)  
**Clarity**: Incomplete (core intent clear; models, scope and pull trigger need confirmation)  
**Scope**: Multiple components (UI menu, Workspace modes, Bedrock Nova + Embeddings, LanceDB, observations bridge)  
**Complexity**: Complex  
**Requirements depth**: Comprehensive (standard+)

## Stated intent (user)

After choosing a repository, show a menu with:

1. **Revisar documentos y hacer observaciones** — current inception + observations flow.
2. **Chat de análisis** sobre documentos, with:
   - Amazon models
   - Amazon embeddings → vector DB **LanceDB** (embedded)
   - Refresh DB on every **pull**
   - **Nova** for chat
   - Button on assistant replies → convert to **observation**
   - Keep chat session while app stays open
   - Show **token consumption** statistics

## Existing product constraints (brownfield)

- Content root: `aidlc-docs/inception/` on branch `dev`
- Observations: profile-based file + push on close
- GitLab auth via `.env` / embed
- Prior Bedrock Nova client remnants exist (`bedrock-client.ts`, `ai-config.ts`) but chat was removed from product

## Gaps requiring answers

See `aidlc-docs/inception/requirements/chat-rag-requirements-questions.md`.
