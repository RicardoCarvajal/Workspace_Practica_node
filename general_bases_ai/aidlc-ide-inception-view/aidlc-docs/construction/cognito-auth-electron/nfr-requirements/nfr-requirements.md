# NFR Requirements — unit-cognito-auth-electron

## Context
Electron desktop client: login/config **solo via HTTP API** (`AIDLC_CONFIG_API_URL`). Tokens y Secret en memoria Main. Sin Cognito SDK en el cliente. MFA OFF.

## Scalability
| Item | Requirement |
|---|---|
| Client concurrency | Single-user desktop process; one auth session at a time |
| Load on API | Aligned with auth-api NFR (&lt; 50 calls/hour); Electron does not fan out |
| Growth | N/A beyond single workstation |

## Performance
| Item | Requirement |
|---|---|
| HTTP timeout | **15 s** per call (login, respond-new-password, config) (Q2=A) |
| UX expectation | Login + config should complete within corporate network without multi-minute waits; no stricter p95 than API (&lt; 5 s server-side) |
| Boot blocking | UI shows submitting state; no parallel duplicate login posts from double-click (disable submit while in flight) |

## Availability / Reliability
| Item | Requirement |
|---|---|
| Offline | Sin API alcanzable → error ES; no avance |
| Auto-retry | **Ninguno** (Q3=A); usuario reintenta desde UI |
| Process crash | Memoria perdida → re-login (US-13) |
| SAM dependency | Endpoints `/auth/login` y `/auth/respond-new-password` deben existir **antes** del Code Gen Electron (Q7=A) |

## Security
| Item | Requirement |
|---|---|
| Auth path | Solo HTTPS hacia API Gateway; TLS validacion estandar; **sin** bypass `NODE_TLS_REJECT_UNAUTHORIZED` (Q4=A) |
| Secrets | AccessToken + RuntimeAppConfig solo en memoria Main (Q8=A); no keytar, no disk |
| Logging | Eventos login/config ok|fail **sin** password, token ni body Secret (Q5=A) |
| Renderer | No recibe Secret completo; IPC acotado |
| Legacy | Eliminar path `aws-credentials.json` / prompt Access Key (FR-14) |
| Env | `.env` solo `AIDLC_CONFIG_API_URL` (+ flags test); no secretos de app post-auth |

## Observability
| Item | Requirement |
|---|---|
| Main logs | Structured appLog events for auth outcomes with redaction |
| User feedback | Errores ES inline / banner (FD); no stack traces en UI |

## Maintainability / Testing
| Item | Requirement |
|---|---|
| Tests | Unit tests AuthApiClient + RuntimeConfigStore (HTTP mock) + checklist manual UI login/new-password/logout (Q6=A) |
| PBT | Optional small properties on config map clear/set if cheap in Code Gen |
| Docs | Actualizar README electron-app con vars y flujo auth |

## Usability
| Item | Requirement |
|---|---|
| Language | Espanol |
| Password field | Incluir **toggle mostrar/ocultar** contrasena (Q9=B) |
| Errors | Inline `errorMessage` en campos cuando aplique; form-level para fallos API |
| Logout | Accion visible topbar/menu |

## Construction sequencing (locked Q7=A)

1. Ampliar `auth-api` con `/auth/login` + `/auth/respond-new-password` (Code Gen delta SAM).
2. Luego Code Gen `electron-app` contra API real.

NFR Design / Code Gen de esta unidad deben respetar ese orden (o un sub-plan SAM dentro de Code Gen Part 1 antes de Electron).

## Extension compliance (this stage)
| Extension | Status | Notes |
|---|---|---|
| Security Baseline | Compliant (planned) | TLS, memory secrets, redacted logs, no credential file |
| Resiliency Baseline | Compliant (planned) | Timeouts, explicit user retry, clear failure modes |
| Property-Based Testing | Compliant (optional) | Small store/client properties if cheap |
