# Infrastructure Design — unit-auth-api-sam

## Locked choices (this stage)

| Item | Choice |
|---|---|
| Stack name (dev) | `devate-aidlc-auth-api` (Q1=B) |
| Region | `us-east-1` |
| Environment | `dev` (parameter `Environment=dev`) |
| AWS CLI profile | `ate` (samconfig section still named `devate`) |
| SAM folder | `auth-api/` |
| Secret name | `/dev/aidlc/auth-api/app-config` (Q2=B); create in stack with placeholder (Q5=A) |
| VPC | Yes — SG + subnets from existing SSM (Q3=B) |
| Lambda size | 256 MB / Timeout 15 s (Q4=A) |
| CORS | Enabled `*` on HTTP API (Q6=B) |

## Resource map (logical → AWS)

| Logical (NFR Design) | AWS resource | Logical ID (suggested) | Physical name |
|---|---|---|---|
| UserPool + AppClient | Cognito User Pool + User Pool Client | `AidlcAuthUserPool`, `AidlcAuthUserPoolClient` | `${AWS::StackName}-user-pool` / client name via stack |
| HttpApiGateway + JwtAuthorizer | `AWS::Serverless::HttpApi` + JWT authorizer | `AidlcConfigHttpApi` | SAM-managed |
| ConfigSessionHandler | `AWS::Serverless::Function` | `ConfigSessionFunction` | `${AWS::StackName}-config-session` |
| AppConfigSecret | `AWS::SecretsManager::Secret` | `AidlcAppConfigSecret` | `/dev/aidlc/auth-api/app-config` |
| AuditTable | `AWS::DynamoDB::Table` | `ConfigSessionAuditTable` | `${AWS::StackName}-config-session-audit` |
| LogGroup | `AWS::Logs::LogGroup` | `ConfigSessionFunctionLogGroup` | `/aws/lambda/${AWS::StackName}-config-session` |
| VPC config | Parameters `AWS::SSM::Parameter::Value` | `LambdaSecurityGroupId`, `SubnetIds` | SSM paths below |

## SSM parameters (existing — reference only)

| Parameter purpose | SSM path pattern |
|---|---|
| Lambda security group | `/${Environment}/ate/parameters/network/default-lambda-security-group` |
| Subnet IDs (comma-separated) | `/${Environment}/ate/parameters/network/subnet-ids` |

For `dev`: `/dev/ate/parameters/network/default-lambda-security-group` and `/dev/ate/parameters/network/subnet-ids`.

**Assumption:** Chosen subnets can reach Secrets Manager and DynamoDB (NAT and/or VPC endpoints). Validate before first deploy.

## Cognito

- MFA: **OFF** (no TOTP/SMS). Admin users; temp password → NEW_PASSWORD_REQUIRED if applicable.
- App client: **public** (no client secret); auth flows USER_PASSWORD_AUTH / SRP / refresh.
- Outputs: UserPoolId, UserPoolClientId, Issuer URL for Electron + JWT authorizer.

## HTTP API

- Route: `POST /config/session`
- JWT authorizer: Cognito Access Token issuer/audience = this pool/client
- CORS: allow `*` origins/methods/headers as needed for Postman web (Q6=B)
- Integration: AWS_PROXY → ConfigSessionFunction

## Lambda

- Runtime: python3.13
- Memory: 256 MB; Timeout: 15 s
- VpcConfig: SecurityGroupIds + SubnetIds from SSM
- Env: `APP_CONFIG_SECRET_NAME` or ARN, `AUDIT_TABLE_NAME`, Powertools service name
- Policies: `secretsmanager:GetSecretValue` on AidlcAppConfigSecret; DynamoDB PutItem (+ optional Update) on audit table
- LoggingConfig JSON; LogGroup RetentionInDays: 7 (dev)
- Description: `AIDLC - CONFIG-SESSION | Returns app config secret for authenticated Cognito sessions`
- Dependencies: `aws-lambda-powertools` (+ boto3 via runtime); pin in `requirements.txt`

## Secrets Manager

- Resource created in stack with **Name** `/dev/aidlc/auth-api/app-config`
- Initial SecretString: placeholder JSON with keys matching `.env` shape (empty or dummy values)
- Operator must `put-secret-value` with real GitLab/AWS keys before production use of desktop app
- Description without accents per team standards

## DynamoDB audit

- PK: `auditId` (S)
- Attributes: principalSub, principalUsername, recordedAt, outcome, apiRequestId, `expires_at` (N)
- TTL on `expires_at` (90 days)
- BillingMode: PAY_PER_REQUEST
- TableName: `${AWS::StackName}-config-session-audit`

## samconfig.toml (dev sketch)

```toml
[default.build.parameters]
cached = true
parallel = true

[devate.deploy.parameters]
stack_name = "devate-aidlc-auth-api"
resolve_s3 = true
s3_prefix = "devate-aidlc-auth-api"
region = "us-east-1"
profile = "devate"
confirm_changeset = true
capabilities = "CAPABILITY_IAM"
parameter_overrides = [
  "Environment=dev"
]
tags = ["Name=AIDLC-AUTH-API", "Environment=DEV", "Project=AIDLC"]
image_repositories = []
```

User must review tags/profile; only `dev` section required for MVP.

## Outputs (for Electron unit)

- HttpApiUrl
- UserPoolId
- UserPoolClientId
- UserPoolIssuer
- AppConfigSecretName (or ARN)
- ConfigSessionAuditTableName

## Documentation (US-16)

Under `auth-api/documentation/`: Wiki.md, context.md, postman.json (Code Generation).
