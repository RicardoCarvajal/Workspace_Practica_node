# Business Logic Model — unit-auth-api-sam

## Capability overview

1. **Identity issuer (Cognito User Pool)** — users created by admin; first login may force password change (temp password); **no MFA**.
2. **Config session delivery** — authenticated caller obtains application config (Secret contents) via `POST /config/session`.
3. **Session audit** — each successful (and optionally failed) config fetch is recorded in DynamoDB for audit (Q7=B).

## Primary flows

### Flow A — First-time user (admin-provisioned)

```text
Admin creates Cognito user (temporary password)
  → User opens Electron (out of this unit)
  → Cognito challenges: NEW_PASSWORD_REQUIRED (if applicable)
  → User sets permanent password
  → Tokens issued (Access Token used by API)
```

### Flow B — Config session (happy path)

```text
Client POST /config/session with valid Access Token
  → Authorizer validates JWT (infra)
  → Lambda loads Secret from Secrets Manager
  → If Secret missing / empty / not JSON → 404 + plain text error (Q2=B, Q6=C)
  → If OK → parse JSON object
  → Write audit record to DynamoDB (session audit)
  → 200 body: { "config": { ...secret keys... } } (Q3=B)
  → Config object is full Secret (Q5=A); keys expected like app `.env` (Q1=A)
```

### Flow C — Unauthorized

```text
Missing/invalid Access Token
  → API Gateway authorizer rejects (401/403)
  → Lambda not invoked (or reject before business logic)
```

## Transformations

| Step | Input | Output |
|---|---|---|
| Parse Secret | SecretString | JSON object (string keys → string values preferred) |
| Wrap response | config object | `{ "config": <object> }` |
| Audit insert | caller identity (sub/username from JWT) + timestamp + result | DynamoDB item |

## Out of scope (this unit)

- Electron UI / IPC
- Filtering or redacting Secret keys
- Sign-up self-service
