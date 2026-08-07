# NFR Requirements — unit-auth-api-sam

## Context
SAM single-account HTTP API: Cognito JWT → Lambda → Secrets Manager + DynamoDB audit. Internal desktop clients only.

## Scalability
| Item | Requirement |
|---|---|
| Expected load | Low: &lt; 50 calls/hour (Q1=A) |
| Scaling | On-demand Lambda / HTTP API; no provisioned concurrency required for MVP |
| Growth | Revisit if desktop rollout exceeds low-load assumptions |

## Performance
| Item | Requirement |
|---|---|
| p95 `POST /config/session` | &lt; **5 s** including Secrets Manager + DynamoDB audit (Q2=B) |
| Lambda timeout | Size ≥ expected work; suggest **10–15 s** (finalize in Infra/Code Gen) |
| Secret fetch | In-memory cache TTL **~5 min** on warm start (Q6=X) to reduce Secrets Manager calls |

## Availability / Reliability
| Item | Requirement |
|---|---|
| Criticality | Internal tool medium/low (Q7=A) |
| Multi-region / elaborate DR | Not required for MVP |
| Fault handling | 404 plain text if config missing/invalid; 5xx without secret leakage; authorizer 401/403 |
| Retry | Client (Electron) may retry idempotent read; audit may duplicate rows (acceptable) |

## Security
| Item | Requirement |
|---|---|
| AuthN | Cognito User Pool (password only, no MFA); Access Token JWT authorizer |
| AuthZ | Only authenticated principals reach Lambda |
| Data at rest | Secrets Manager for config; DynamoDB audit without secret payload |
| Data in transit | HTTPS (API Gateway) |
| Logging | No Secret values, tokens, or passwords in CloudWatch |
| IAM | Least privilege: GetSecretValue on one secret; DynamoDB write on audit table |

## Observability
| Item | Requirement |
|---|---|
| Logs | Lambda JSON logs; retention **7 days** in dev (Q4=A) |
| Audit | DynamoDB records; TTL **90 days** (Q5=A) |
| Metrics | Default API Gateway / Lambda metrics sufficient for MVP |

## Maintainability / Testing
| Item | Requirement |
|---|---|
| Tests | Unit tests (parse Secret, 404 path, audit shape) + manual Postman checklist (Q8=A) |
| Docs | Wiki.md, context.md, postman.json (US-16) |
| PBT | Optional small properties on JSON parse / envelope shape in Code Gen if cheap |

## Usability
| Item | Requirement |
|---|---|
| API errors | Plain text messages (FD); Spanish or neutral English short phrases — pick one in Code Gen, keep consistent |

## Extension compliance (this stage)
| Extension | Status | Notes |
|---|---|---|
| Security Baseline | Compliant (planned) | TLS, JWT, password auth, no secret logs, least privilege |
| Resiliency Baseline | Compliant / N/A mix | Low criticality; single-region OK; timeouts + clear errors |
| PBT | Partial / planned | Prefer unit tests; optional properties on parse/envelope |
