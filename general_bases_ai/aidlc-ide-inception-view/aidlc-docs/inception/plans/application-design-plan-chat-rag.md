# Application Design Plan (Delta) — Chat RAG / modos

**Depth**: Minimal  
**Source**: `requirements.md` FR-11..FR-14 (answers Q1–Q10)  
**Status**: Decisions taken from approved requirements — no additional design questions.

## Checklist

- [x] Identify components for mode select + chat RAG
- [x] Generate `components-chat-rag.md`
- [x] Generate `component-methods-chat-rag.md`
- [x] Generate `services-chat-rag.md`
- [x] Generate `component-dependency-chat-rag.md`
- [x] Validate against FR-11..FR-14

## Locked decisions (from requirements)

| Topic | Decision |
|---|---|
| Mode UI | Full-screen intermediate two cards |
| Chat | Analysis + citations only; no inception edits |
| Models | Nova Lite + Titan Embed Text v2; us-east-1 |
| Vector DB | LanceDB per projectId under userData |
| Index scope | MD under inception excluding observaciones/ |
| Reindex | On observations pull |
| Convert | Append observation draft, no auto-push |
| Tokens | Last turn + session cumulative |
| AWS | `.env` only |
