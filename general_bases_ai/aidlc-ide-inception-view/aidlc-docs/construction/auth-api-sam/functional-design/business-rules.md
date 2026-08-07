# Business Rules — unit-auth-api-sam

## BR-01 — Secret content shape
- Secret MUST be JSON object whose keys align with the desktop app `.env` (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `GITLAB_*` as used, `AIDLC_DEV_MODE`, optional `AIDLC_TEST_REPO_URL`).
- Extra keys ARE allowed and returned (Q1=A).
- Lambda does NOT whitelist-filter keys (Q5=A).

## BR-02 — Invalid or empty Secret
- If Secret is missing, empty string, or not parseable JSON object → respond **404** with plain-text message (Q2=B, Q6=C).
- Do not return partial config.

## BR-03 — Success response envelope
- HTTP 200 body MUST be `{ "config": { ... } }` where `config` is the parsed Secret object (Q3=B).
- No additional required fields (`version` optional later; not required now).

## BR-04 — Cognito user lifecycle
- Only administrators create users (no app sign-up).
- New users may receive temporary password; MUST change password on first login if challenged (Q4=A updated: **no TOTP/MFA**).
- Ongoing auth: username + password only.

## BR-05 — Authorization gate
- `POST /config/session` is only reachable with a valid Cognito **Access Token** (authorizer).
- Business logic assumes caller is already authenticated.

## BR-06 — Session audit (mandatory)
- Each invocation that reaches Lambda for config fetch MUST write an audit record to DynamoDB (Q7=B).
- Minimum fields: timestamp, principal (`sub` and/or username from JWT claims), outcome (`success` | `config_not_found` | `error`), request id if available.
- Audit MUST NOT store Secret values or full config payload.

## BR-07 — Error message style
- Client-visible errors use **plain text** body (Q6=C), no AWS SDK dumps, no stack traces, no secret material.

## BR-08 — Side effects of POST
- Aside from audit write (BR-06) and CloudWatch logs (no secrets), `POST /config/session` does not mutate the Secret or Cognito user state.

## BR-09 — Logging
- Never log Secret contents, temporary passwords, or Access Tokens.
