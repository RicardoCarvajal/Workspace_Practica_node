# AIDLC Auth API

## General Description

SAM stack that authenticates desktop users via **Amazon Cognito** (User Pool, username/password, **no MFA**). The Electron app talks **only to this HTTP API** (not Cognito directly):

1. `POST /auth/login` (public) — Lambda calls Cognito `InitiateAuth`
2. Optional `POST /auth/respond-new-password` (public) — `NEW_PASSWORD_REQUIRED`
3. `POST /config/session` (JWT Access Token) — Secrets Manager JSON shaped like desktop `.env`

Each config fetch writes a best-effort audit row to DynamoDB (TTL 90 days).

## Flow Diagram

```text
Electron (user + password)
        |
        v
POST /auth/login (no JWT) --> Lambda --> Cognito InitiateAuth
        |
        | Access Token  (or NEW_PASSWORD_REQUIRED challenge)
        v
POST /config/session (Bearer) --> JWT authorizer --> Lambda
                                      |-- GetSecret /dev/aidlc/auth-api/app-config
                                      +-- PutItem audit table
                                      v
                               { "config": { ... } }
```

## AWS Resources

| Resource | Purpose |
|---|---|
| Cognito User Pool + App Client | Username/password (public client; no MFA) |
| HTTP API | `/auth/login`, `/auth/respond-new-password` (public), `/config/session` (JWT) |
| Lambda `auth-login` | Cognito InitiateAuth |
| Lambda `auth-respond-new-password` | Cognito RespondToAuthChallenge |
| Lambda `config-session` | Read secret, wrap response, audit |
| Secrets Manager `/dev/aidlc/auth-api/app-config` | App runtime config JSON |
| DynamoDB `*-config-session-audit` | Audit trail with TTL |
| Log groups | Lambda logs (7 days in dev) |

## Deploy

```bash
cd auth-api
sam build
sam deploy --config-env devate
```

Profile: `ate`. Confirm SSM paths for SG/subnets exist in the account. After deploy, replace Secret placeholder values with real `.env` content. Create Cognito users in the console (no self-sign-up in the desktop app).

## Support Procedures

| Symptom | Action |
|---|---|
| 401 on `/auth/login` | Wrong password or unknown user |
| 401/403 on `/config/session` | Check Access Token, issuer, audience (client id) |
| 404 Config not found | Secret empty/invalid JSON — update Secret value |
| 500 / timeout | Check VPC NAT/endpoints; CloudWatch logs |
| Audit missing | Best-effort: config may still return 200; inspect Lambda warn logs |

## Postman

See `postman.json` in this folder.
