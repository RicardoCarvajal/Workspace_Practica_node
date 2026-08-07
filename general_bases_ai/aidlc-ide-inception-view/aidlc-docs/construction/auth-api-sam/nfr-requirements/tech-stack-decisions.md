# Tech Stack Decisions — unit-auth-api-sam

| Decision | Choice | Rationale |
|---|---|---|
| IaC | AWS SAM (`auth-api/`) | Team standard; single-account |
| API | API Gateway **HTTP API** + JWT authorizer | Already decided in requirements |
| Compute | **AWS Lambda** Python **3.13** | Team Lambda standard (Q3=A) |
| Auth | Amazon Cognito User Pool (no MFA) | Requirements / FD (MFA removed 2026-08-04) |
| Config store | AWS Secrets Manager | `.env`-shaped JSON |
| Audit store | DynamoDB PAY_PER_REQUEST + TTL 90d | FD Q7 + NFR Q5=A |
| Region / env | `us-east-1` / `dev` only (MVP) | Requirements |
| Logging | CloudWatch Logs, 7d retention (dev) | Q4=A |
| Secret caching | Process memory, TTL ~5 min | Q6=X |
| HTTP client docs | Postman collection | US-16 / Q8 |
| Unit test runner | pytest (expected with Python) | Align with Code Gen |

## Explicit non-choices (MVP)
- Node.js runtime
- Provisioned concurrency / multi-region
- Filtering Secret keys at Lambda
- API Key auth (JWT Cognito only)
