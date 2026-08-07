# Unit Dependency — Cognito Auth + SAM API (delta)

## Matrix

| Unit | Depends on | Dependency type |
|---|---|---|
| unit-auth-api-sam | — | Root (cloud identity + config API) |
| unit-cognito-auth-electron | unit-auth-api-sam | Runtime: User Pool Id, App Client Id, API base URL, JWT issuer; contract `POST /config/session` |

## Sequence

```text
1. Design stages for unit-auth-api-sam (and optionally design Electron in parallel after SAM design starts)
2. Code Generation + deploy/smoke unit-auth-api-sam
3. Design remaining / Code Generation unit-cognito-auth-electron against real or documented API
4. Build and Test (both)
```

## Shared contracts (between units)

| Contract | Owner | Consumer |
|---|---|---|
| Cognito User Pool + App Client IDs | SAM outputs / params | Electron Main (baked or config after login bootstrap) |
| HTTP API URL | SAM output | ConfigApiClient |
| Access Token JWT | Cognito | HTTP API authorizer + Electron holder |
| Secret JSON keys (`.env` shape) | AidlcAppConfigSecret | Electron RuntimeConfigStore + GitLab/Bedrock |

## Rollback

- Electron: revert boot to previous build (without Cognito gate) if needed
- SAM: delete/stack rollback; Electron will fail config fetch until restored
