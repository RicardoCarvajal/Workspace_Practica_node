# Unit of Work Plan — Cognito Auth + SAM API (delta)

**Application design approved**: 2026-08-04  
**Proposed baseline** (from `execution-plan-cognito-auth.md`): 2 units — SAM first, then Electron

**Artifacts to generate (Part 2)** — delta-specific files (no overwrite of base UoW):
- [x] `unit-of-work-cognito-auth.md`
- [x] `unit-of-work-dependency-cognito-auth.md`
- [x] `unit-of-work-story-map-cognito-auth.md`
- [x] Validate boundaries vs design + stories
- [x] Present Units Generation Complete

---

## Questions — fill every `[Answer]:`

---

## Question 1
¿Confirmas la descomposicion en **2 units**?

A) Si — `unit-auth-api-sam` + `unit-cognito-auth-electron` (como el execution plan)

B) Tres units — separar **documentacion SAM** (US-16) como unit propio

C) Un solo unit monolito (SAM + Electron juntos en un solo ciclo de construction)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Asignacion de **US-16** (docs Wiki/context/postman)

A) Dentro de `unit-auth-api-sam` (al final del code gen del API)

B) Unit aparte (solo si Q1=B)

C) Diferir docs a Build and Test / post-MVP (no en construction de units)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3
Orden de construction

A) **SAM completo** (FD→NFR→Infra→Code) y **despues** Electron completo

B) Disenos de ambos en paralelo, code gen SAM primero, luego Electron

C) Electron primero con mocks, SAM despues

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 4
¿Donde vive el **retiro** de `aws-credentials.json` / prompt AWS (FR-14)?

A) Solo en `unit-cognito-auth-electron`

B) Mitad en cada unit (SAM no escribe file; Electron elimina UX/store)

C) Unit de “cleanup” separado

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
Criterio de **tamano** de unit

A) Por **deployable** (SAM stack vs Electron app) — preferido

B) Por **historia** (una story ≈ una unit)

C) Por **capa** (UI / Main / Infra como 3 units)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
Nombres finales de los units

A) `unit-auth-api-sam` y `unit-cognito-auth-electron`

B) `unit-aidlc-config-api` y `unit-aidlc-desktop-auth`

C) Mantener A pero carpetas construction: `construction/auth-api-sam/` y `construction/cognito-auth-electron/`

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Resolved decisions (2026-08-04)

| Q | Answer | Implication |
|---|---|---|
| 1 | A | 2 units: `unit-auth-api-sam` + `unit-cognito-auth-electron` |
| 2 | A | US-16 docs dentro de `unit-auth-api-sam` |
| 3 | B | Disenos de ambos pueden ir en secuencia de stages; **code gen SAM primero**, luego Electron |
| 4 | A | Retiro `aws-credentials.json` / prompt AWS solo en Electron unit |
| 5 | A | Units por **deployable** (SAM stack vs Electron app) |
| 6 | A | Nombres: `unit-auth-api-sam`, `unit-cognito-auth-electron` |

**Ambiguities:** None.

**Part 2 will create:**
- `unit-of-work-cognito-auth.md`
- `unit-of-work-dependency-cognito-auth.md`
- `unit-of-work-story-map-cognito-auth.md`

---

## Instructions

1. ~~Rellena cada `[Answer]:`.~~ Done  
2. **Approve this plan** in chat to run Part 2 generation  
3. Or **Request Changes**
