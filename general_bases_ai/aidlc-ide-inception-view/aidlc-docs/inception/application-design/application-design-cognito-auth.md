# Application Design — Cognito Auth + SAM API (delta)

**Status**: Draft for approval  
**Plan answers**: `plans/application-design-plan-cognito-auth.md`  
**Units (next)**: `unit-auth-api-sam` → `unit-cognito-auth-electron`

## Decisions locked

| Topic | Choice |
|---|---|
| Cognito runtime | Electron **Main** only (IPC from UI) |
| MFA | **OFF** (sin TOTP/SMS; decision 2026-08-04) |
| User Pool | Created in SAM stack |
| API auth | JWT authorizer with **Access Token** |
| Endpoint | `POST /config/session` → Secret JSON |
| SAM path | `auth-api/` |
| Config lifecycle | Memory only; legacy AWS prompt / `aws-credentials.json` removed from boot |
| Architecture | Minimal (thin Lambda; Electron auth + store) |

## Artifact index

| File | Content |
|---|---|
| `components-cognito-auth.md` | Components Electron + SAM |
| `component-methods-cognito-auth.md` | Method signatures |
| `services-cognito-auth.md` | Orchestration services |
| `component-dependency-cognito-auth.md` | Dependencies + data flow |

## Boundary summary

- **SAM owns**: Cognito Pool/Client, HTTP API, Lambda, Secret resource, docs under `documentation/` for this API
- **Electron owns**: Login/MFA UI, Main Cognito client, memory config, boot order before profile
- **Out of scope here**: Sign-up UI; Rekognition; Identity Pool; detailed IAM/policy wording (NFR Design)

## Traceability

| Req / Story | Design coverage |
|---|---|
| FR-17 / US-01 | CognitoLoginView + CognitoAuthMain + TOTP |
| FR-18 / US-02 | AidlcConfigHttpApi + ConfigApiClient |
| FR-19 | AidlcAppConfigSecret + ConfigSessionFunction |
| FR-20 / US-13 | RuntimeConfigStore memory-only |
| US-14 | AppBootOrchestrator → ProfileSetup |
| US-15 | clearSession + store.clear |
| US-16 | SAM documentation (construction) |
| FR-14 | Retire LegacyAwsCredentialsPrompt |

## Extension compliance (design stage)

| Extension | Status | Notes |
|---|---|---|
| Security Baseline | Compliant (planned) | TLS, JWT, MFA, no secret logs, memory-only |
| Resiliency Baseline | Compliant (planned) | Clear fail on auth/config errors |
| PBT | Deferred | Pure helpers (parse secret JSON keys) in construction |
