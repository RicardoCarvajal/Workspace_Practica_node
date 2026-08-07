# Domain Entities — unit-auth-api-sam

## AppConfig (from Secret)

| Attribute | Type | Notes |
|---|---|---|
| keys | map string → string (typical) | Same semantic keys as desktop `.env` |
| (extras) | allowed | Returned as-is |

Logical aggregate: the entire Secret JSON object becomes `config` in the HTTP response.

## ConfigSessionResponse

| Attribute | Type | Notes |
|---|---|---|
| config | AppConfig | Required on success |

## ConfigSessionAuditRecord

| Attribute | Type | Notes |
|---|---|---|
| auditId | string | UUID or request id |
| principalSub | string | Cognito `sub` |
| principalUsername | string \| null | if present in claims |
| recordedAt | timestamp | ISO or epoch |
| outcome | enum | `success`, `config_not_found`, `error` |
| apiRequestId | string \| null | API Gateway / Lambda request id |

**Persistence**: DynamoDB table (introduced by Q7=B; detailed in Infrastructure Design).

## CognitoUser (managed identity)

| Attribute | Type | Notes |
|---|---|---|
| username | string | Login id |
| status | enum | FORCE_CHANGE_PASSWORD, CONFIRMED, etc. |
| mfaEnabled | boolean | Always false / unused (MFA off) |

Not stored by this Lambda; owned by Cognito User Pool.

## Relationships

```text
CognitoUser --issues--> AccessToken
AccessToken --authorizes--> ConfigSessionRequest
ConfigSessionRequest --reads--> AppConfig (Secret)
ConfigSessionRequest --writes--> ConfigSessionAuditRecord
ConfigSessionRequest --returns--> ConfigSessionResponse
```
