# Code Generation Plan — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Stories**: US-01, US-02 (client), US-13, US-14, US-15 (+ SAM delta for login contract)  
**Code roots**: `auth-api/` (delta first) then `electron-app/`  
**Docs summary**: `aidlc-docs/construction/cognito-auth-electron/code/`  
**Design sources**: FD + NFR Req + NFR Design (approved)  
**Infrastructure Design**: SKIPPED

## Unit context
- Electron autentica **solo via API** (no Cognito SDK / no Pool-Client Id en cliente)
- Memory-only AccessToken + RuntimeConfigStore; MFA OFF; errores ES genéricos
- fetch + 15s timeout; sin auto-retry; bake `AIDLC_CONFIG_API_URL`
- Config fail tras login → clear token; segunda sesion bloqueada hasta logout
- Show/hide password toggle; retirar `aws-credentials.json` / prompt Access Key del boot

## Dependencies
- Stack `auth-api` ya generado; este plan **amplia** endpoints publicos de login
- Electron brownfield: modificar `electron/main`, preload, `App.tsx`, views

## Phase A — auth-api delta (execute first)

- [x] Step 1: Update `auth-api/template.yaml` — add `AuthLoginFunction` + `AuthRespondNewPasswordFunction` (Python, VPC same as config-session, timeout/memory aligned, LogGroups 7d); env `USER_POOL_ID`, `USER_POOL_CLIENT_ID`; IAM `cognito-idp:InitiateAuth`, `RespondToAuthChallenge` on pool; HttpApi events `POST /auth/login` and `POST /auth/respond-new-password` with **`Auth: Authorizer: NONE`** (override default JWT)
- [x] Step 2: Implement login handlers in `auth-api/src/` (e.g. `auth_login.py`, `auth_respond_new_password.py` or shared `auth_cognito.py`) — USER_PASSWORD_AUTH; return tokens JSON or `{ challenge: "NEW_PASSWORD_REQUIRED", session, username }`; map Cognito errors to short plain-text 401/400; never log password; NEW_PASSWORD via RespondToAuthChallenge
- [x] Step 3: Wire handlers in SAM (`Handler:` paths); keep existing `POST /config/session` + JWT unchanged
- [x] Step 4: Unit tests `auth-api/tests/` — challenge envelope, success token shape, error mapping (mock boto3 Cognito)
- [x] Step 5: Update `auth-api/documentation/` Wiki.md, context.md, postman.json — document `/auth/login`, `/auth/respond-new-password`, flow Electron→API→Cognito
- [x] Step 6: Run `pytest` for auth-api; fix failures

## Phase B — electron-app

- [x] Step 7: Main modules — `AuthApiClient` (fetch, 15s AbortSignal), `AuthSessionStore`, `RuntimeConfigStore`, `AuthErrorMapper` (ES genericos), `AuthIpcHandlers` under `electron-app/electron/main/` (paths matching existing layout)
- [x] Step 8: Preload + IPC types — expose `authLogin`, `authRespondNewPassword`, `authLogout`, extend `bootstrap`/`sessionStatus` with `{ authenticated, configLoaded }` **without** leaking Secret; remove or stop exposing `saveAwsLocalCredentials` from boot path
- [x] Step 9: Wire Main boot — require auth+config before profile/repos; on config fail clear session (NFR Q1=A); block second login if session active (Q7=B); consumers (GitLab/Bedrock) read RuntimeConfigStore instead of aws-credentials file / env secrets for locked path
- [x] Step 10: UI — `AuthLoginView` (user/pass, show-password toggle, submitting lock, ES errors); `AuthNewPasswordView`; update `App.tsx` boot routing; logout control in header/menu; retire AWS credentials UX from `ProfileSetupPage` / related prompts (FR-14)
- [x] Step 11: Env — document/add `AIDLC_CONFIG_API_URL` in electron-app `.env.example` / README; bake for dist as project already does for env
- [x] Step 12: Unit tests Electron (project test runner) — AuthApiClient + RuntimeConfigStore + session gate (mock fetch)
- [x] Step 13: Construction summary — `aidlc-docs/construction/cognito-auth-electron/code/code-summary.md`
- [x] Step 14: Run Electron unit tests for new modules; fix failures

## Traceability

| Story / FR | Steps |
|---|---|
| US-01 | 1–2, 7–10 |
| US-02 client | 7–9 |
| US-13 | 7, 9 |
| US-14 | 9–10 |
| US-15 | 8–10 |
| FR-14 | 8–10 |
| SAM login delta | 1–6 |
| NFR / NFR Design | all |

## Out of scope this plan
- `sam deploy` / creating Cognito users / filling Secret values (operator)
- MFA / Cognito SDK in Electron
- Settings UI to edit API URL
- e2e Spectron/Playwright
- Identity Pool / Rekognition

## Approval

Approve this plan to execute **Steps 1–14** in order (Phase A then B) and generate/modify code under `auth-api/` and `electron-app/`.
