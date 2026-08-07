# Tech Stack Decisions — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Code root**: `electron-app/`

## Decisions

| Area | Choice | Rationale |
|---|---|---|
| HTTP client (Main) | Native **`fetch`** | Q1=A; sin dependencia extra en Main |
| Timeout | **15 s** AbortController / AbortSignal | Q2=A |
| Retries | None automatic | Q3=A; UI retry |
| TLS | System default validation | Q4=A |
| Token / config store | In-process Main memory modules | Q8=A; US-13 |
| Cognito client | **Not in Electron** | FD Q0=A; Cognito only in SAM Lambdas |
| Env config | `AIDLC_CONFIG_API_URL` via `.env` / bake | FD Q1=A |
| UI | Existing Electron React stack; AuthLoginView + AuthNewPasswordView; show-password toggle | Q9=B |
| Tests | Vitest/Jest (project default) for Main modules + manual checklist | Q6=A |
| SAM auth endpoints | Implement in `auth-api/` **before** Electron CG | Q7=A |

## Explicit non-choices

| Not using | Why |
|---|---|
| Cognito Identity SDK / amplify in Renderer or Main | API-only auth |
| Axios in Main (unless already unavoidable elsewhere) | Q1=A prefers fetch |
| keytar / electron-store for tokens | Contradicts memory-only session |
| e2e Spectron/Playwright in MVP | Q6≠C |

## Integration contract (consume)

| Endpoint | Client module |
|---|---|
| `POST /auth/login` | AuthApiClient.login |
| `POST /auth/respond-new-password` | AuthApiClient.respondNewPassword |
| `POST /config/session` | AuthApiClient.fetchConfig (Bearer) |

## Alignment with unit-auth-api-sam

- Reuse existing `/config/session` + JWT authorizer.
- New public (no JWT) login Lambdas must not log passwords; return short error bodies suitable for ES UI mapping.
- Electron timeout 15 s ≥ expected API p95 &lt; 5 s with margin.
