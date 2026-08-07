# Functional Design Plan — unit-auth-api-sam

**Unit**: `unit-auth-api-sam`  
**Stories**: US-02 (server), US-16; supports US-01 (issuer)  
**Scope**: Business logic for config session API + Cognito pool rules (technology-agnostic where possible; infra details later)

## Part 2 checklist (after answers)

- [x] `business-logic-model.md`
- [x] `business-rules.md`
- [x] `domain-entities.md`
- [x] (no frontend for this unit)
- [x] Present Functional Design Complete

---

## Resolved decisions

| Q | Answer | Meaning |
|---|---|---|
| 1 | A | Secret keys like `.env`; extras OK |
| 2 | B | Invalid/empty Secret → **404** |
| 3 | B | Response `{ "config": { ... } }` |
| 4 | A | Admin user + temp password → change + TOTP enroll |
| 5 | A | Return full Secret (no filter) |
| 6 | C | Errors as plain text |
| 7 | B | **DynamoDB audit** per config session call |

**Note:** Q7 adds DynamoDB audit to this unit (Infrastructure Design must include table + IAM).

---

## Questions — fill every `[Answer]:`

---

## Question 1
¿Que claves **minimas** debe exigir el Secret JSON (ademas de las del `.env` actual)?

A) Exactamente las del `.env` de la app hoy (`GITLAB_*` si aplican, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AIDLC_DEV_MODE`, `AIDLC_TEST_REPO_URL` opcionales) — sin validar claves extra

B) Whitelist fija documentada; rechazar respuesta si falta alguna obligatoria (lista en X o A + obligatorias)

C) Devolver el Secret tal cual sin validacion de claves en Lambda (solo JSON parseable)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Si el Secret no es JSON valido o esta vacio

A) Error de servidor (5xx); no devolver body parcial

B) 404 “config not found”

C) 200 con `{}` y que Electron falle despues

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 3
Respuesta de `POST /config/session` (exito)

A) Body = objeto plano con claves del Secret (sin wrapper)

B) Body = `{ "config": { ... } }`

C) Body = `{ "config": { ... }, "version": "..." }`

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 4
Politica de usuarios Cognito (negocio)

A) Solo admin crea usuarios (temporary password); usuario debe cambiar password en primer login + enrolar TOTP antes de usar la app

B) Admin crea usuarios ya con MFA enrolado fuera de banda; la app solo pide password + TOTP code

C) Password permanente al crear; MFA TOTP obligatorio en primer uso si no enrolado (challenge asociado)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
¿La Lambda debe **filtrar** el Secret (quitar claves internas) antes de responder?

A) No — devolver el JSON completo del Secret

B) Si — solo whitelist de claves conocidas por la app Electron

C) Si — excluir solo prefijos `INTERNAL_*` / `_meta`

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
Errores de negocio/API hacia el cliente (forma)

A) Status HTTP + body `{ "error": { "code": "...", "message": "..." } }` (sin detalles de AWS)

B) Solo status HTTP, body vacio

C) Mensaje texto plano

X) Other (describe after [Answer]: below)

[Answer]: C

---

## Question 7
Idempotencia / estado de `POST /config/session`

A) Es **lectura** del Secret; POST solo por convencion; sin side effects de negocio (salvo logs)

B) Debe registrar “sesion” en DynamoDB (auditoria) por cada llamada

C) Rate-limit de negocio (max N por usuario/minuto) ademas del authorizer

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Instructions

1. Rellena cada `[Answer]:` en este archivo.
2. Escribe **listo** en el chat.
