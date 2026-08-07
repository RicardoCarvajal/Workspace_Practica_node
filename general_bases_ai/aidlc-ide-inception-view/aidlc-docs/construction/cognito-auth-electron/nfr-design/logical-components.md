# Logical Components — unit-cognito-auth-electron

**Structure (Q6=A)**: clear Main modules — no heavy hexagonal.

## Component map

```text
Renderer                          Main
────────                          ────
AuthLoginView ──IPC──► AuthIpcHandlers
AuthNewPasswordView               │
Logout control                    ├─► AuthApiClient (fetch, 15s)
                                  ├─► AuthSessionStore (AccessToken memory)
                                  └─► RuntimeConfigStore (config map memory)
```

## AuthApiClient

| Responsibility | Detail |
|---|---|
| Base URL | From baked `AIDLC_CONFIG_API_URL` |
| Methods | `login`, `respondNewPassword`, `fetchConfig` |
| Timeout | AbortController 15 s |
| Errors | Throw typed/status errors for mapper (no raw body to UI) |

## AuthSessionStore

| Responsibility | Detail |
|---|---|
| Hold | `accessToken`, optional `username`, `expiresAt` |
| `set` / `clear` / `hasSession` | Memory only |
| Gate | If `hasSession` && config loaded → reject new login until logout (Q7=B) |

## RuntimeConfigStore

| Responsibility | Detail |
|---|---|
| Hold | `Record<string,string>` from `{ config }` envelope |
| Readers | GitLab / Bedrock / existing Main services |
| `clear` | On logout or config-fail-after-login (with session clear) |

## AuthIpcHandlers

| Channel | Behavior |
|---|---|
| login | If already authenticated+configured → error ES “cierra sesion primero”; else login → fetchConfig → set stores; on config fail clear session (Q1=A) |
| respondNewPassword | Complete challenge → fetchConfig same rules |
| logout | Clear both stores |
| bootstrap / sessionStatus | Expose `{ authenticated, configLoaded }` without secrets |

## AuthErrorMapper (Main or shared util)

| Input | Output (ES) |
|---|---|
| 401 login | Credenciales invalidas… |
| 404 config | No se pudo cargar la configuracion… |
| Abort/network/5xx | No hay conexion… / Error del servicio… |
| Session already active | Cierra sesion antes de iniciar otra… |

## Renderer components

| Component | Depends on |
|---|---|
| AuthLoginView | IPC login; show-password toggle; submitting lock |
| AuthNewPasswordView | IPC respondNewPassword |
| App boot | sessionStatus; route to login vs profile |
| Topbar logout | IPC logout |

## SAM delta components (Code Gen first, same unit plan)

| Component | Role |
|---|---|
| AuthLoginFunction | Cognito InitiateAuth; return tokens or NEW_PASSWORD_REQUIRED |
| AuthRespondNewPasswordFunction | RespondToAuthChallenge |
| Routes | Public POST `/auth/login`, `/auth/respond-new-password` (no JWT) |
| Existing | `/config/session` + JWT authorizer unchanged |

## Explicit non-components (MVP)

- Circuit breaker / local config TTL refresher
- Settings UI for API URL
- Cognito SDK in Electron
- keytar / disk session
