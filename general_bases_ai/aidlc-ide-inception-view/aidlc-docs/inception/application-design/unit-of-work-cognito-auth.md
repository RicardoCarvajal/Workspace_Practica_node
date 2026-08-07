# Units of Work — Cognito Auth + SAM API (delta)

**Decomposition**: By deployable (Q5=A)  
**Build order**: Code generation **SAM first**, then Electron (Q3=B)  
**Base app units**: unchanged (`unit-of-work.md`); this delta adds two units below

## Code organization (delta)

```text
/
  auth-api/                   # unit-auth-api-sam (SAM app)
    template.yaml
    samconfig.toml
    src/
    documentation/
  electron-app/               # unit-cognito-auth-electron (desktop app)
    electron/
    src/views/
    shared/
```

---

## Unit 1: unit-auth-api-sam

| Field | Value |
|---|---|
| **Type** | Service (independently deployable SAM stack) |
| **Priority** | P0 — first in code gen |
| **Responsibility** | Cognito User Pool + MFA TOTP; HTTP API JWT (Access Token); `POST /config/session`; Lambda lee Secrets Manager; docs SAM |
| **Components** | AidlcAuthUserPool, AidlcConfigHttpApi, ConfigSessionFunction, AidlcAppConfigSecret |
| **Stories** | US-02 (API side), US-16; supports US-01 tokens issuer |
| **Req** | FR-18, FR-19, FR-20 (server), NFR-01 |
| **Out of scope** | Electron UI; `aws-credentials.json`; sign-up UI |
| **Construction path** | `aidlc-docs/construction/auth-api-sam/` |
| **Code root** | `auth-api/` |

### Success criteria
- Deploy `dev` / `us-east-1` stack
- Valid Access Token → 200 JSON Secret; invalid → 401/403
- Wiki/context/postman present

---

## Unit 2: unit-cognito-auth-electron

| Field | Value |
|---|---|
| **Type** | Module within desktop Electron app |
| **Priority** | P0 — second (after SAM code gen / deployable API) |
| **Responsibility** | Login Cognito+MFA via Main; fetch config; memory store; boot before profile; remove local AWS prompt/file |
| **Components** | CognitoLoginView, CognitoAuthMain, ConfigApiClient, RuntimeConfigStore, AppBootOrchestrator; retire LegacyAwsCredentialsPrompt |
| **Stories** | US-01, US-02 (client), US-13, US-14, US-15 |
| **Req** | FR-14, FR-17, FR-20 (client), NFR-01 |
| **Depends on** | unit-auth-api-sam (Pool IDs, API URL, live or documented contract) |
| **Out of scope** | Creating Cognito users; SAM template |
| **Construction path** | `aidlc-docs/construction/cognito-auth-electron/` |
| **Code root** | `electron-app/` |

### Success criteria
- Arranque: Cognito(+TOTP) → config → perfil/app
- Sin `aws-credentials.json` / prompt Access Key en este flujo
- Logout/quit limpia tokens y config en memoria

---

## Per-unit construction stages (from execution plan)

| Stage | unit-auth-api-sam | unit-cognito-auth-electron |
|---|---|---|
| Functional Design | EXECUTE | EXECUTE |
| NFR Requirements | EXECUTE | EXECUTE |
| NFR Design | EXECUTE | EXECUTE |
| Infrastructure Design | EXECUTE | SKIP |
| Code Generation | EXECUTE | EXECUTE |
| Build and Test | After both units | After both units |
