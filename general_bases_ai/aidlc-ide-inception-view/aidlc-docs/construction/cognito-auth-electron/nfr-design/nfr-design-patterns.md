# NFR Design Patterns — unit-cognito-auth-electron

## Resilience

| Pattern | Design |
|---|---|
| Config fail after login | **Fail closed**: clear AccessToken; show ES config error; stay on login (retry = full password again) (Q1=A) |
| Network / 5xx | No auto-retry (NFR Req); user retries from UI |
| Timeout | AbortSignal **15 s** per HTTP call; map to generic network/timeout ES message |
| Double-submit | Disable Submit while `submitting=true`; one IPC in flight (Q2=A) |
| Challenge mid-flow | NEW_PASSWORD_REQUIRED held only in UI/Main challenge state; cancel clears challenge |

## Scalability (desktop)

| Pattern | Design |
|---|---|
| Session cardinality | **One session per Main process**; if session+config already active, **block** second login until explicit logout (Q7=B) |
| Concurrent HTTP | Single auth pipeline; no parallel login+config races from UI |

## Performance

| Pattern | Design |
|---|---|
| Config cache | **No** TTL refresh; one `/config/session` at login success; `RuntimeConfigStore` holds values until logout (Q3=A) |
| HTTP client | Native `fetch` + AbortController |
| UI | Submitting indicators; no background polling |

## Security

| Pattern | Design |
|---|---|
| Trust boundary | Renderer → IPC → Main → HTTPS API only; no Cognito SDK in Electron |
| TLS | System validation; no reject-unauthorized bypass |
| Secrets | Memory-only AccessToken + config map; never write to disk |
| Error mapping | **Generic ES by HTTP family** (401 credentials, 404 config, network/5xx); **never** show raw API body (Q4=A) |
| API base URL | Baked at build from `.env` / define; **no** Settings editor in MVP (Q5=A) |
| Logs | Event ok/fail without password, token, or Secret body |
| Legacy | Remove aws-credentials path from boot |

## Observability

| Pattern | Design |
|---|---|
| Main logging | Structured appLog for auth outcomes + redaction |
| User-visible | ES inline / form errors only |

## Code Generation sequencing

| Pattern | Design |
|---|---|
| Order | Code Gen Part 1: **auth-api delta first** (`/auth/login`, `/auth/respond-new-password`, tests, docs), then **electron-app** (Q8=A) |

## Extension compliance (this stage)
| Extension | Status | Notes |
|---|---|---|
| Security Baseline | Compliant (planned) | TLS, memory secrets, generic errors, bake URL |
| Resiliency Baseline | Compliant (planned) | Timeouts, fail-closed config, disable double-submit |
| Property-Based Testing | N/A / optional | Store clear/set properties at Code Gen if cheap |
