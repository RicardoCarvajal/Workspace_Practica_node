# Code Summary — unit-auth-api-sam

## Created (application)

| Path | Role |
|---|---|
| `auth-api/template.yaml` | SAM: Cognito, HTTP API, Lambda, Secret, DynamoDB, LogGroup |
| `auth-api/samconfig.toml` | `devate` deploy profile |
| `auth-api/src/app.py` | Lambda handler |
| `auth-api/src/config_session.py` | Pure helpers |
| `auth-api/src/requirements.txt` | powertools + boto3 pinned |
| `auth-api/tests/test_config_session.py` | Unit tests |
| `auth-api/documentation/Wiki.md` | Ops wiki |
| `auth-api/documentation/context.md` | Project context |
| `auth-api/documentation/postman.json` | Postman collection |

## Stories covered

- US-02 (server): `POST /config/session`
- US-16: documentation trio
- Cognito pool/client for US-01 issuer

## Operator follow-ups

1. `sam build && sam deploy --config-env devate`
2. Put real JSON into `/dev/aidlc/auth-api/app-config`
3. Create Cognito users (admin)
4. Pass stack Outputs to Electron unit
