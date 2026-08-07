# NFR Design — unit-chat-rag-lancedb

- Bedrock clients created per call or short-lived with creds from `getAwsCredentials()`.
- LanceDB path: `app.getPath('userData')/lancedb/{projectId}`.
- Reindex replaces table `chunks` atomically (drop + recreate).
- Token accumulate: sum input/output from Converse `usage`.
- CSP/renderer unchanged; all AI via IPC.

- [x] Patterns documented
