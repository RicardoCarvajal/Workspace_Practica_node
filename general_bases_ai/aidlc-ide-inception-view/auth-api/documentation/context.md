# Context — aidlc-auth-api

## Project

- **Repo folder**: `auth-api/`
- **Stack (dev)**: `devate-aidlc-auth-api`
- **Region**: `us-east-1`
- **AWS profile (samconfig)**: `ate` (`--config-env devate`)

## Purpose

Provide Cognito-backed authentication and delivery of desktop application configuration (Secrets Manager JSON equivalent to `.env`) for the AIDLC IDE Electron app. Electron authenticates **only via this API** (`/auth/login`, optional `/auth/respond-new-password`, then `/config/session`). Configuration is stored only in Electron process memory after fetch (client unit).

## Key decisions

- Single-account SAM; HTTP API
- Public `/auth/*` (Lambda → Cognito); JWT Access Token authorizer on `/config/session`
- Cognito User Pool without MFA; users provisioned by admin
- Response envelope: `{ "config": { ... } }`
- Invalid secret → HTTP 404 plain text
- DynamoDB audit best-effort (does not block 200)
- Lambda Powertools secret cache max_age 300s
- VPC using existing SSM: `/dev/ate/parameters/network/default-lambda-security-group`, `/dev/ate/parameters/network/subnet-ids`

## Related product docs

- `aidlc-docs/inception/requirements/requirements.md` (FR-17..FR-20)
- `aidlc-docs/construction/auth-api-sam/`
