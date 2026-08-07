# Code Summary — unit-cognito-auth-electron

**Generated**: 2026-08-04  
**Roots**: `auth-api/` (delta) + `electron-app/`

## Phase A — auth-api

| Item | Detail |
|---|---|
| `POST /auth/login` | Public; Lambda `auth_login` → Cognito `InitiateAuth` USER_PASSWORD_AUTH |
| `POST /auth/respond-new-password` | Public; Cognito `RespondToAuthChallenge` |
| `POST /config/session` | Unchanged; JWT authorizer |
| Helpers | `auth_cognito.py` |
| Docs | Wiki / context / Postman updated |
| Tests | `tests/test_auth_cognito.py` (+ existing config tests) — 11 passed |

## Phase B — electron-app

| Item | Detail |
|---|---|
| Main | `AuthApiClient`, `cognito-auth-service`, `AuthSessionStore`, `RuntimeConfigStore` |
| IPC | `getCognitoAuthStatus`, `cognitoLogin`, `cognitoRespondNewPassword`; logout clears Cognito+config |
| UI | `CognitoAuthLoginPage`, `CognitoNewPasswordPage`; boot Cognito → profile → GitLab bootstrap |
| FR-14 | `isAwsPromptMode()` always false; Bedrock prefers RuntimeConfigStore |
| Env | `AIDLC_CONFIG_API_URL` in `.env.example` |
| Tests | `tests/unit/cognito-auth-electron.test.ts` |

## Operator follow-up

1. `cd auth-api && sam build && sam deploy --config-env devate` (profile `ate`)
2. Fill Secrets Manager `/dev/aidlc/auth-api/app-config`
3. Create Cognito users
4. Set `AIDLC_CONFIG_API_URL` in `electron-app/.env` to HttpApiUrl output
5. `cd electron-app && npm run dev`

## Traceability

US-01, US-02 client, US-13, US-14, US-15, FR-14; SAM login delta for API-only auth (Q0=A).
