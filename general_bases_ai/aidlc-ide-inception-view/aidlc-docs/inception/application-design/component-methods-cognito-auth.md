# Component Methods — Cognito Auth + SAM API (delta)

High-level signatures only. Business rules detail → Functional Design (construction).

## CognitoLoginView (Renderer)

| Method | In | Out | Purpose |
|---|---|---|---|
| `submitCredentials(username, password)` | strings | Promise result/error | IPC login step 1 |
| `submitMfaCode(code)` | string | Promise result/error | IPC MFA TOTP |
| `showError(message)` | string | void | UI error (no stack traces) |

## CognitoAuthMain (Main)

| Method | In | Out | Purpose |
|---|---|---|---|
| `initiateAuth(username, password)` | strings | `{ status: 'SUCCESS' \| 'MFA_REQUIRED', ... }` | Cognito USER_PASSWORD_AUTH / USER_SRP_AUTH |
| `respondToMfaChallenge(session, code)` | session + TOTP | tokens or error | SOFTWARE_TOKEN_MFA |
| `getAccessToken()` | — | string \| null | Token en memoria |
| `clearSession()` | — | void | Logout / app quit |

## ConfigApiClient (Main)

| Method | In | Out | Purpose |
|---|---|---|---|
| `fetchSessionConfig(accessToken)` | JWT | `Record<string, string>` | `POST /config/session` |

## RuntimeConfigStore (Main)

| Method | In | Out | Purpose |
|---|---|---|---|
| `setConfig(map)` | key/value | void | Cargar Secret en memoria |
| `getConfig()` | — | map \| null | Lectura runtime |
| `get(key)` | string | string \| undefined | Clave puntual |
| `clear()` | — | void | Cerrar sesion / quit |

## AppBootOrchestrator (Main/Renderer)

| Method | In | Out | Purpose |
|---|---|---|---|
| `runBoot()` | — | next screen id | Cognito → config → profile/app |
| `onAuthFailure(err)` | error | void | Bloquear avance |

## ConfigSessionFunction (Lambda)

| Method | In | Out | Purpose |
|---|---|---|---|
| `handler(event, context)` | API Gateway HTTP event (JWT already validated) | 200 + JSON body Secret | Leer Secret; 5xx si falla |

## AidlcConfigHttpApi (infra)

| Method / route | In | Out | Purpose |
|---|---|---|---|
| `POST /config/session` | Authorization: Bearer access token | 200 JSON Secret | Entregar config de sesion |
