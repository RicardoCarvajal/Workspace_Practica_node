# Services — Cognito Auth + SAM API (delta)

## Electron Main services

### CognitoAuthService
- **Orchestrates**: CognitoLoginView IPC → CognitoAuthMain → tokens en memoria
- **Pattern**: Request/response IPC; sin persistencia de password/tokens en disco
- **Failure**: Errores amigables a UI; no avanza boot

### SessionConfigService
- **Orchestrates**: Access Token → ConfigApiClient → RuntimeConfigStore → consumidores (GitLab, Bedrock)
- **Pattern**: Una carga post-login; clear en logout/quit
- **Failure**: 401/403/5xx → error claro; app no opera “a medias” sin config

### BootService
- **Orchestrates**: CognitoAuthService → SessionConfigService → ProfileSetup / AppShell
- **Pattern**: Pipeline secuencial estricto (FR-17)
- **Failure**: Cualquier paso falla → permanece en login o pantalla de error

## SAM / cloud services

### ConfigSessionService (Lambda application logic — minimal)
- **Orchestrates**: (Authorizer ya valido JWT) → Secrets Manager get → HTTP 200 body
- **Pattern**: Thin handler; optional in-memory cache of secret on warm start (NFR design later)
- **Failure**: No secret / IAM → 500 sin filtrar contenido del secret en logs

### CognitoIdentityService (managed AWS)
- **Orchestrates**: User Pool + MFA TOTP; usuarios creados fuera de la app
- **Pattern**: Managed service; App Client public/native para desktop

## Orchestration sequence (happy path)

```text
User → CognitoLoginView → IPC → CognitoAuthMain → Cognito
     → (MFA TOTP if required)
     → Access Token in Main memory
     → ConfigApiClient POST /config/session
     → RuntimeConfigStore.setConfig
     → ProfileSetup / AppShell
```
