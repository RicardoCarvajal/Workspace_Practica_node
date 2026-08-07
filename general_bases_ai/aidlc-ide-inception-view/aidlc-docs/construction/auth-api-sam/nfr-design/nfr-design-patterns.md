# NFR Design Patterns — unit-auth-api-sam

## Resilience

| Pattern | Design |
|---|---|
| Audit write failure | **Degrade gracefully**: still return **200** + config; log warn that audit failed (Q1=A). Login must not block on audit. |
| Secrets Manager transient failure | **One short internal retry**, then **5xx** plain text (Q2=A). No circuit breaker / no stale-beyond-TTL fallback in MVP. |
| Authorizer rejection | Fail closed at API Gateway (401/403); Lambda not invoked. |

## Performance

| Pattern | Design |
|---|---|
| Secret caching | Use **AWS Lambda Powertools** (Parameters / secrets utility) with **max_age ≈ 300 s (5 min)** aligned to NFR Q6 (Q3=X). Prefer Powertools over ad-hoc globals where practical. |
| Cold start | Acceptable under p95 &lt; 5 s budget for low load. |
| DynamoDB audit | Async-feeling sync put; keep item small (no config payload). |

## Scalability

| Pattern | Design |
|---|---|
| Compute | On-demand Lambda; no provisioned concurrency (low load). |
| Data | DynamoDB on-demand; Secrets Manager managed service. |

## Security

| Pattern | Design |
|---|---|
| Cognito App Client | **Public client** (no client secret in Electron) (Q4=A); USER_PASSWORD / SRP flows; **no MFA**. |
| JWT | HTTP API JWT authorizer validates Access Token before Lambda. |
| Least privilege | IAM: GetSecretValue on one secret ARN; DynamoDB PutItem on audit table only. |
| Log hygiene | Powertools Logger with redaction where applicable; never log Secret/token/password. |
| Envelope | Success `{ "config": {...} }`; errors plain text; 404 when config invalid/missing (FD). |

## Observability

| Pattern | Design |
|---|---|
| Logging | Structured logs via Powertools Logger (recommended with Q3). |
| Alarms | **None in MVP** (Q6=A); rely on default metrics. |
| Audit trail | DynamoDB + TTL 90d (NFR); best-effort write (Q1=A). |

## Code structure

| Pattern | Design |
|---|---|
| Handler layout | **Minimal**: single handler module + small helpers (cache/Powertools, audit, parse) (Q5=A). |
| Hexagonal folders | Not required for this unit MVP. |
