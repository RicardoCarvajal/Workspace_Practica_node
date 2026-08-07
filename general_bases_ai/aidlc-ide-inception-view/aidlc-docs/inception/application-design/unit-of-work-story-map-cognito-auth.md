# Unit ↔ Story Map — Cognito Auth + SAM API (delta)

| Story | Priority | unit-auth-api-sam | unit-cognito-auth-electron |
|---|---|---|---|
| US-01 Autenticarme Cognito (+ MFA) | P0 | Issuer (User Pool) | **Primary** (UI + Main SDK) |
| US-02 Obtener Secret via API | P0 | **Primary** (HTTP API + Lambda + Secret) | Client call + store |
| US-13 Config solo en memoria | P0 | — | **Primary** |
| US-14 Continuar a perfil post-auth | P0 | — | **Primary** |
| US-15 Cerrar sesion / limpiar memoria | P0 | — | **Primary** |
| US-16 Docs SAM Wiki/context/postman | P1 | **Primary** | — |

## Coverage check

- All Cognito delta stories (US-01, US-02, US-13..US-16) assigned: **Yes**
- No story left without a primary unit: **Yes**
- FR-14 (retire local AWS file/prompt): **unit-cognito-auth-electron** only

## Base product stories

US-03..US-12 remain with existing base units (`unit-of-work.md`); unchanged by this delta except that GitLab/AWS runtime config will eventually read `RuntimeConfigStore` after Electron unit lands.
