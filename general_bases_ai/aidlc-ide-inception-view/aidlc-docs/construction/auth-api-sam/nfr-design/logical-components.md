# Logical Components — unit-auth-api-sam

## Component map

| Logical component | Role | Notes |
|---|---|---|
| **HttpApiGateway** | Entry + TLS + routing `POST /config/session` | JWT authorizer attached |
| **JwtAuthorizer** | Validates Cognito Access Token | Issuer = User Pool |
| **UserPool + AppClient** | Identity (password only) | Public app client (no secret); MFA OFF |
| **ConfigSessionHandler** | Business orchestration | Minimal Python module + helpers |
| **SecretsProvider** | Read + cache Secret | **Lambda Powertools** max_age ~300s |
| **AppConfigSecret** | Source of truth for `.env` JSON | Secrets Manager |
| **AuditWriter** | Put audit item | DynamoDB; failure → warn only |
| **AuditTable** | Store ConfigSessionAuditRecord | TTL attribute 90d |
| **LogGroup** | Lambda logs | Retention 7d (dev) |

## Request path (logical)

```text
Client
  → HttpApiGateway + JwtAuthorizer
  → ConfigSessionHandler
       → SecretsProvider (Powertools cache)
       → AuditWriter (best-effort)
  → 200 { config } | 404 text | 5xx text
```

## Failure overlays

```text
SecretsManager error → 1 retry → 5xx text
AuditWriter error    → log warn → still 200 if config OK
Invalid JWT          → stop at authorizer
```

## Explicitly not in MVP

- CloudWatch Alarms
- SQS / DLQ (sync request/response only)
- Client secret in desktop app
- Hexagonal multi-package layout
