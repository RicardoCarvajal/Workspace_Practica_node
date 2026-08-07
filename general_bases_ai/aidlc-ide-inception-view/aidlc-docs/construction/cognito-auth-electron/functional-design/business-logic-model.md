# Business Logic Model — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Code root**: `electron-app/`  
**Architecture lock (Q0=A)**: Electron autentica **solo contra el API SAM**; Cognito vive en Lambdas. Electron **no** usa User Pool Id ni Client Id.  
**MFA**: OFF  
**Plan answers**: Q0–Q7 = A

## Scope

| In | Out |
|---|---|
| Login UI + change-password challenge UI | Cognito SDK en Electron |
| Main: HTTP client a API (`AIDLC_CONFIG_API_URL`) | Persistir tokens/Secret en disco |
| RuntimeConfigStore memoria | Formulario / `aws-credentials.json` |
| Boot: auth+config → perfil/app | Sign-up Cognito en app |
| Logout limpia sesion | Infra AWS (skip) |

## Primary flows

### F1 — Arranque con sesion limpia

```text
App start
  → AppBootOrchestrator: sin AccessToken / sin config en memoria
  → mostrar AuthLoginView (antes de ProfileSetup)
  → usuario envia usuario + contrasena (IPC → Main)
  → AuthApiClient.POST /auth/login
       ├─ 200 + tokens → F2
       ├─ 200 + challenge NEW_PASSWORD_REQUIRED → F3
       └─ 401/4xx → error ES en UI; permanece en login
```

### F2 — Cargar config tras tokens

```text
AccessToken en memoria (Main)
  → AuthApiClient.POST /config/session (Authorization: Bearer)
       ├─ 200 { config } → RuntimeConfigStore.set(config)
       │                    → continuar a perfil existente o ProfileSetup (US-14)
       ├─ 401/403 → error ES; limpiar token; volver login
       └─ 404/5xx → error ES (config no disponible); no avanzar como configurado
```

### F3 — NEW_PASSWORD_REQUIRED

```text
AuthApiClient recibio challenge + session
  → AuthNewPasswordView (nueva + confirmacion)
  → AuthApiClient.POST /auth/respond-new-password { session, newPassword, username }
       ├─ 200 + tokens → F2
       └─ error → mensaje ES; permanece en challenge o vuelve a login
```

### F4 — Cerrar sesion (US-15)

```text
Usuario elige "Cerrar sesion" (topbar/menu)
  → Main: clear AccessToken + RuntimeConfigStore.clear()
  → UI vuelve a AuthLoginView
  → GitLab/Bedrock/repos no usables hasta F1+F2 exitosos
```

### F5 — Quit app

```text
Proceso termina → memoria liberada
  → siguiente arranque exige F1 de nuevo (US-13)
```

## API contract (Electron consume; SAM debe exponer)

| Method | Path | Auth | Body / notes | Success |
|---|---|---|---|---|
| POST | `/auth/login` | none (public) | `{ username, password }` | tokens **o** challenge |
| POST | `/auth/respond-new-password` | none | `{ username, session, newPassword }` | tokens |
| POST | `/config/session` | Bearer Access Token | empty/minimal | `{ config: { ... } }` |

**Delta SAM**: `unit-auth-api-sam` hoy solo tiene `/config/session` + JWT authorizer. Con Q0=A hace falta anadir `/auth/login` y `/auth/respond-new-password` (Lambdas → Cognito `InitiateAuth` / `RespondToAuthChallenge`). Documentar en NFR / Code Gen del API o como follow-up inmediato antes de Code Gen Electron.

## Electron configuration

| Variable | Purpose |
|---|---|
| `AIDLC_CONFIG_API_URL` | Base URL del HTTP API (`.env` / bake dist) |
| Flags test repo (si existen) | Sin bypass de auth |

**No** en Electron: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`.

## Legacy retirement (FR-14)

- Eliminar del boot path: prompt AWS Access Key/Secret, IPC `saveAwsLocalCredentials`, uso de `aws-credentials.json`.
- Bedrock/GitLab leen solo `RuntimeConfigStore` tras F2.

## Traceability

| Story | Flows |
|---|---|
| US-01 | F1, F3 |
| US-02 | F2 |
| US-13 | F2 store, F5 |
| US-14 | post-F2 → ProfileSetup / app |
| US-15 | F4 |
| FR-14 | F5 legacy removal |
