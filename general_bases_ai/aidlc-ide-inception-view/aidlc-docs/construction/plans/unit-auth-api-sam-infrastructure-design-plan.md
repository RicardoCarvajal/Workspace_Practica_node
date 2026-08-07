# Infrastructure Design Plan — unit-auth-api-sam

**Prior**: NFR Design approved  
**Next**: Code Generation  
**Constraints already locked**: single-account SAM, `auth-api/`, HTTP API, Cognito+TOTP, Secrets Manager, DynamoDB audit, `dev` / `us-east-1`, Python 3.13

## Part 2 checklist

- [x] `infrastructure-design.md`
- [x] `deployment-architecture.md`
- [x] Present Infrastructure Design Complete

---

## Resolved decisions

| Q | Answer | Meaning |
|---|---|---|
| 1 | B | Stack `devate-aidlc-auth-api` |
| 2 | B | Secret `/dev/aidlc/auth-api/app-config` |
| 3 | B + SSM | VPC; SG `/.../default-lambda-security-group`; subnets `/.../subnet-ids` |
| 4 | A | 256 MB / 15 s |
| 5 | A | Create Secret in stack + placeholder; operator fills values |
| 6 | B | CORS `*` |
| 7 | X | profile `devate` |

---

## Questions — fill every `[Answer]:`

---

## Question 1
Nombre del stack SAM (`stack_name` en samconfig `dev`)

A) `dev-aidlc-auth-api`

B) `devate-aidlc-auth-api`

C) Otro — escribe el nombre exacto en X

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 2
Nombre fisico del Secret en Secrets Manager

A) `!Sub ${AWS::StackName}-app-config` (JSON `.env`)

B) Path fijo `/dev/aidlc/auth-api/app-config`

C) Parametro de template; valor por ambiente en samconfig

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 3
¿Lambda en **VPC**?

A) **No** — acceso publico a Secrets Manager / DynamoDB via AWS APIs (mas simple)

B) Si — subnets/SG via SSM (estandar corporativo)

X) Other (describe after [Answer]: below)

[Answer]: B los secrets o parameters con los id ya exsisten (!Sub /${environment}/ate/parameters/network/default-lambda-security-group) y (!Sub /${environment}/ate/parameters/network/subnet-ids)

---

## Question 4
Sizing Lambda (Memory / Timeout)

A) **256 MB** / **15 s**

B) **512 MB** / **10 s**

C) **128 MB** / **10 s**

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
Valor inicial del Secret en el stack

A) Crear `AWS::SecretsManager::Secret` con placeholder JSON; el operador completa valores reales post-deploy

B) No crear el Secret en el stack — solo referenciar un secret ya existente (ARN/nombre por parametro)

C) Crear Secret vacio + documentar `put-secret-value` obligatorio antes de usar la app

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
CORS en HTTP API

A) No CORS (solo clientes desktop / no browser)

B) CORS abierto `*` por si se prueba desde browser/Postman web

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 7
Profile AWS en `samconfig.toml`

A) Placeholder `profile = "CHANGEME"` — el usuario asigna el profile real

B) Sin profile (usar default del entorno)

C) Profile fijo que indiques en X

X) Other (describe after [Answer]: below)

[Answer]: X devate

---

## Instructions

1. Rellena cada `[Answer]:`.
2. Escribe **listo** en el chat.
