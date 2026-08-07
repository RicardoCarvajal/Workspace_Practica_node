# NFR Design Patterns — unit-inception-viewer

| Pattern | Decision |
|---|---|
| Retry | None automatic; user retries |
| Timeout | 30s fetch |
| Cancel | AbortController per IPC GET |
| Cache | No tree/file cache (always GitLab; drafts overlay) |
| Secrets | Session only; drafts never store credentials |
| Path allowlist | Only `aidlc-docs/inception/**` |
| Logging | Operation name; no file body / tokens |
