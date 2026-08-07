# Code Generation Plan — unit-auth-api-sam

**Unit**: `unit-auth-api-sam`  
**Stories**: US-02 (server), US-16; Cognito issuer for US-01  
**Code root**: `auth-api/` (workspace root — never under `aidlc-docs/`)  
**Docs summary**: `aidlc-docs/construction/auth-api-sam/code/`  
**Design sources**: FD + NFR + Infrastructure Design (approved)

## Unit context
- SAM single-account: Cognito User Pool (TOTP) + HTTP API JWT + Lambda Python 3.13 + Secrets Manager + DynamoDB audit
- Stack: `devate-aidlc-auth-api`; profile `devate`; region `us-east-1`
- Secret name: `/dev/aidlc/auth-api/app-config`
- VPC via SSM: `/dev/ate/parameters/network/default-lambda-security-group`, `/dev/ate/parameters/network/subnet-ids`
- `POST /config/session` → `{ "config": {...} }`; 404 plain text if bad secret; audit best-effort; Powertools cache ~5 min

## Dependencies
- Existing corporate SSM network parameters in target account
- No dependency on Electron unit for this code gen (Electron consumes outputs later)

## Steps (execute in order after plan approval)

- [x] Step 1: Create folder layout `auth-api/` (`template.yaml`, `samconfig.toml`, `src/`, `tests/`, `documentation/`)
- [x] Step 2: Write `template.yaml` — Parameters (Environment, SSM-typed SG/subnets), Cognito User Pool + public App Client (TOTP MFA), HttpApi + JWT authorizer, `ConfigSessionFunction` (VPC, 256MB/15s, Python 3.13), Secret `/dev/aidlc/auth-api/app-config` placeholder, DynamoDB audit table + TTL, LogGroup 7d, IAM least privilege, Outputs, resource Descriptions per team standards
- [x] Step 3: Write `samconfig.toml` — `[default.build]` + `[devate.deploy]` with stack `devate-aidlc-auth-api`, profile `devate`, `parameter_overrides`, tags
- [x] Step 4: Implement Lambda `src/` — handler + helpers (parse secret, envelope, audit put, Secrets via Powertools max_age 300, 1 retry on SM, audit fail → still 200)
- [x] Step 5: Add `src/requirements.txt` — pin `aws-lambda-powertools` (and any needed deps; no open ranges)
- [x] Step 6: Unit tests under `tests/` — parse/envelope/404 path/audit shape (pytest); no real AWS required for pure helpers
- [x] Step 7: Documentation US-16 — `documentation/Wiki.md`, `context.md`, `postman.json`
- [x] Step 8: Construction markdown summary — `aidlc-docs/construction/auth-api-sam/code/code-summary.md` (+ test-summary if useful)
- [x] Step 9: Run unit tests locally (`pytest`) and fix failures
- [x] Step 10: Optional sanity — `sam validate` if SAM CLI available (non-blocking if missing)

## Traceability

| Story / FR | Steps |
|---|---|
| US-02 / FR-18 / FR-19 / FR-20 | 2, 4, 5 |
| US-16 | 7 |
| FD BR-01..09 | 4, 6 |
| NFR / Infra | 2, 3 |
| DynamoDB audit | 2, 4 |

## Out of scope this plan
- Deploy to AWS (`sam deploy`) — operator runs with profile `devate`
- Creating Cognito end users
- Electron client (`unit-cognito-auth-electron`)
- Filling real secret values (placeholder only)

## Approval

Approve this plan to execute Steps 1–10 and generate code under `auth-api/`.
