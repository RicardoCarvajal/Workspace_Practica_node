# Application Design Plan — Cognito Auth + SAM API (delta)

**Prerequisites**: Workflow plan approved (`execution-plan-cognito-auth.md`)  
**Scope**: High-level components/services for Electron auth + SAM config API (not detailed business rules)

---

## Execution checklist (Part 2 — after answers + plan approval)

- [x] Generate `components-cognito-auth.md`
- [x] Generate `component-methods-cognito-auth.md`
- [x] Generate `services-cognito-auth.md`
- [x] Generate `component-dependency-cognito-auth.md`
- [x] Generate consolidated `application-design-cognito-auth.md`
- [x] Validate consistency vs FR-14, FR-17..FR-20 / US-01..US-16
- [x] Present Application Design Complete

---

## Questions — fill every `[Answer]:` in this file

---

## Question 1
¿Donde se ejecuta el **SDK Cognito** (`InitiateAuth` / MFA)?

A) Solo en **Electron Main** (Renderer envia user/password por IPC; Main habla con Cognito)

B) Solo en **Renderer** (Amplify / amazon-cognito-identity-js); Main solo recibe tokens via IPC

C) Main para auth; Renderer solo UI de formularios (password nunca queda en store persistente)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Tipo de **MFA** a disenar en el User Pool (SAM)

A) **TOTP** (app autenticadora) — recomendado para desktop interno

B) **SMS**

C) Ambos habilitados; el usuario elige al enrolar

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3
¿El **User Pool Cognito** se crea en este stack SAM?

A) Si — Cognito User Pool + App Client en `auth-api/` (SAM)

B) No — User Pool existente; el stack solo referencia Pool Id / Client Id / issuer via parametros

C) Pool nuevo en SAM, pero usuarios iniciales se crean manualmente post-deploy (sin sign-up en app)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 4
Token enviado al **JWT authorizer** de la HTTP API

A) **Access Token** Cognito

B) **ID Token** Cognito

C) Cualquiera de los dos; documentar uno como canonico en design (elige y escribe cual en X si hace falta)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
Contrato del endpoint de configuracion

A) `GET /config` (o `/v1/config`) → body JSON = contenido del Secret (mismas claves que `.env`)

B) `POST /config/session` → mismo body JSON

C) `GET /config` pero respuesta envuelta `{ "config": { ... } }`

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 6
Nombre de la carpeta SAM en el repo

A) `auth-api/`

B) `auth-api/`

C) `aidlc-auth-api/`

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 7
Tras este delta, ¿que pasa con **`AIDLC_DEV_MODE`** y el bake de GitLab en `npm run dist`?

A) Runtime siempre desde Secret en memoria tras Cognito; embed de compile solo como fallback de emergencia documentado (o eliminado en code gen)

B) Mantener embed/`AIDLC_DEV_MODE` para desarrollo local **sin** Cognito (bypass) aunque requirements digan auth siempre — describe bypass en X

C) Eliminar por completo el flujo `aws-credentials.json` y el prompt AWS; Cognito+API es el unico camino; `.env` local solo para `npm run dist` de **Client Id / API URL / User Pool** (no secretos GitLab/AWS)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 8
Estilo de arquitectura para el diseno de componentes

A) Hexagonal ligero en Lambda (handler → application → ports); Electron: pantallas + services Main existentes

B) Minimal: Lambda handler monolito; Electron sin capas nuevas mas alla de auth + memory store

C) Clean Architecture estricta en Electron y Lambda

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Resolved decisions (2026-08-04)

| Q | Answer | Design implication |
|---|---|---|
| 1 | A | Cognito solo en **Main**; Renderer → IPC (user/password/MFA code) |
| 2 | A | MFA **TOTP** en User Pool |
| 3 | A | User Pool + App Client creados en SAM `auth-api/` |
| 4 | A | JWT authorizer usa **Access Token** |
| 5 | B | `POST /config/session` → JSON = Secret (claves tipo `.env`) |
| 6 | B | Carpeta **`auth-api/`** |
| 7 | A | Runtime = Secret en memoria tras Cognito; embed compile solo fallback de emergencia o se elimina en code gen |
| 8 | B | Lambda handler minimal; Electron: UI auth + memory store (sin Clean Architecture estricta) |

**Ambiguities:** None blocking. Q7: en design, el camino canonico es Cognito+API+memoria; el embed legacy se marca deprecated.

---

## Instructions

1. ~~Rellena cada `[Answer]:`.~~ Done  
2. Artefactos generados en `aidlc-docs/inception/application-design/*-cognito-auth.md`
