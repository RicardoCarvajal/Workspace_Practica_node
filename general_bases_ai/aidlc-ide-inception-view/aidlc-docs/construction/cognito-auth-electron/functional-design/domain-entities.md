# Domain Entities — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Layer**: conceptos de dominio / sesion en Main (sin persistencia)

## AuthSession (Main, memory)

| Field | Type | Notes |
|---|---|---|
| accessToken | string | JWT Access Token emitido tras `/auth/login` (o respond-new-password) |
| expiresAt | number \| null | epoch ms si el API lo indica; opcional en MVP |
| username | string | ultimo usuario autenticado (solo memoria; no password) |

**Invariants**: Si `accessToken` es null, no hay sesion. Logout pone todo a null.

## AuthChallenge (transient UI/Main)

| Field | Type | Notes |
|---|---|---|
| type | `"NEW_PASSWORD_REQUIRED"` | unico challenge en MVP |
| session | string | session Cognito reenviada al API |
| username | string | para respond-new-password |

## RuntimeAppConfig (Main, memory) — RuntimeConfigStore

| Field | Type | Notes |
|---|---|---|
| values | `Record<string, string>` | claves equivalentes al `.env` / Secret (`AWS_*`, GitLab, etc.) |
| loadedAt | number | epoch ms |

**Invariants**: Vacio hasta F2 exitoso. No serializar a disco.

## ApiEndpointConfig (build-time / env)

| Field | Type | Notes |
|---|---|---|
| baseUrl | string | `AIDLC_CONFIG_API_URL` |

## Relationships

```text
AuthSession --1--> RuntimeAppConfig   (config solo tiene sentido con sesion; logout limpia ambos)
AuthChallenge --0..1--> AuthSession   (challenge reemplaza sesion hasta tokens)
ApiEndpointConfig --> AuthApiClient   (todas las llamadas HTTP)
```

## UI view models (no persistidos)

| Entity | Fields |
|---|---|
| LoginForm | username, password, errorMessage?, submitting |
| NewPasswordForm | newPassword, confirmPassword, errorMessage?, submitting |

## Retired entities (FR-14)

| Entity | Action |
|---|---|
| AwsLocalCredentials (file/prompt) | Eliminar del dominio de boot |
| credentialsSource env-as-secrets for prod path | Sustituido por RuntimeAppConfig post-API |
