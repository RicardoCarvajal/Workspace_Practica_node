# Frontend Components — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Code root**: `electron-app/`  
**UI kit**: respetar stack actual de la app (NextUI/shadcn segun pantalla existente); mensajes en espanol.

## Hierarchy

```text
App (boot orchestrator)
├── AuthLoginView          ← nuevo / reemplaza gate actual
├── AuthNewPasswordView    ← challenge NEW_PASSWORD_REQUIRED
├── ProfileSetupPage       ← solo tras config OK (existente)
├── (app shell: repos, workspace, …)
│     └── Logout control en topbar/menu
└── (retirado) AWS credentials prompt / local save UI
```

## AuthLoginView

| Aspect | Design |
|---|---|
| Props | `onSuccess()`, `error?` (opcional si error local) |
| State | username, password, submitting, fieldErrors, formError |
| Actions | submit → `aidlcApi.authLogin({ username, password })` |
| Outcomes | success → parent avanza boot; challenge → navega NewPassword; error → ES inline |
| Validation | required username/password; `errorMessage` en inputs |

## AuthNewPasswordView

| Aspect | Design |
|---|---|
| Props | `username`, `session`, `onSuccess()`, `onCancel()` → login |
| State | newPassword, confirmPassword, submitting, errors |
| Actions | submit → `aidlcApi.authRespondNewPassword(...)` |
| Validation | required; confirm match; policy errors from API |

## App boot wiring (`App.tsx` / controller)

| Step | Behavior |
|---|---|
| 1 | `bootstrap()` / session check: sin token+config → AuthLoginView |
| 2 | Tras login+config OK → profile o login de colaborador existente |
| 3 | Header: boton/menu **Cerrar sesion** visible cuando hay sesion |
| 4 | Logout → clear + AuthLoginView |

## Main / preload IPC (superficie)

| Channel (conceptual) | Direction | Payload |
|---|---|---|
| `auth.login` | Renderer → Main | `{ username, password }` |
| `auth.respondNewPassword` | Renderer → Main | `{ username, session, newPassword }` |
| `auth.logout` | Renderer → Main | — |
| `auth.sessionStatus` / bootstrap extend | Renderer → Main | `{ authenticated, configLoaded }` |

Main implementa HTTP; Renderer **nunca** ve el Secret completo ni lo pinta.

## AuthApiClient (Main)

| Method | HTTP |
|---|---|
| `login` | `POST {baseUrl}/auth/login` |
| `respondNewPassword` | `POST {baseUrl}/auth/respond-new-password` |
| `fetchConfig` | `POST {baseUrl}/config/session` + Bearer |

## RuntimeConfigStore (Main)

| Method | Behavior |
|---|---|
| `set(config)` | replace memory map |
| `get()` / `require()` | readers for GitLab/Bedrock |
| `clear()` | on logout / failed session |

## Retired UI / IPC

- Remove or stop registering: save AWS local credentials UI, prompts that write `aws-credentials.json`.
- Boot must not branch to “enter Access Key” when `AIDLC_DEV_MODE` / missing env secrets; auth API path is mandatory (Q5=A).

## Interaction sketch

```text
[AuthLoginView] --login--> [Main AuthApiClient]
                              |-- challenge --> [AuthNewPasswordView]
                              |-- tokens -----> fetchConfig --> [RuntimeConfigStore]
                                                              --> ProfileSetup / App
[Topbar Logout] --logout--> clear session+config --> [AuthLoginView]
```
