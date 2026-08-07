# Story Generation Plan — Cognito Auth + SAM API (delta)

**Stage**: User Stories — Part 1 Planning  
**Requirements**: `aidlc-docs/inception/requirements/requirements.md` (FR-14, FR-17..FR-20)  
**Assessment**: `user-stories-assessment-cognito-auth.md` — Execute = Yes  
**Base stories**: `aidlc-docs/inception/user-stories/stories.md` (existentes; este delta agrega/actualiza)

---

## Execution checklist (Part 2 — after plan approval)

- [x] Apply answered methodology (personas, breakdown, granularity, format)
- [x] Generate / update `personas.md` for auth delta
- [x] Generate / append Cognito auth stories to `stories.md` (or agreed artifact)
- [x] Ensure INVEST + acceptance criteria per story
- [x] Map personas ↔ stories
- [x] Trace stories to FR-14, FR-17..FR-20, NFR-01
- [x] Present User Stories Complete for approval

---

## Story options (breakdown approaches)

| Approach | Benefit | Trade-off |
|---|---|---|
| **User Journey-Based** | Sigue el arranque: login → MFA → API → perfil | Menos agrupacion por componente tecnico |
| **Feature-Based** | Agrupa Cognito / API Secret / Memoria Electron | Puede fragmentar el viaje |
| **Persona-Based** | Un usuario principal (P-01) | Admin Cognito fuera de app casi sin stories |
| **Epic-Based** | Epic Auth + sub-stories MFA/API | Mas jerarquia; util si hay muchas stories |
| **Hybrid** | Journey para orden + Feature para titulos | Requiere regla clara (ver Q3) |

---

## Questions — fill every `[Answer]:` in this file

Please answer in this document (not only in chat). Use **A/B/C…** or **X** with a short description after the tag.

---

## Question 1
¿Como tratamos las **personas** en este delta?

A) Mantener solo **P-01 Colaborador funcional**; actualizar contexto (login Cognito + MFA al arrancar)

B) Mantener P-01 y anadir **P-02 Admin AWS** (crea usuarios Cognito fuera de la app) solo como nota/contexto, **sin** stories de admin en Electron

C) Solo P-01 sin cambios al texto de persona; las stories bastan

X) Other (describe after [Answer]: below)

[Answer]: X El usuario de cognito es el funcional

---

## Question 2
¿Como **organizamos** las stories de este delta?

A) **User Journey** — orden del arranque (login → MFA → cargar config → continuar a perfil)

B) **Feature-Based** — bloques Cognito UI / API config / memoria sesion / retiro AWS local

C) **Epic-Based** — un epic “Auth Cognito + Config” con sub-stories

D) **Hybrid** — journey para el orden de lectura; titulos agrupados por feature (Cognito / API / Memoria)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3
¿**Granularidad** del login Cognito + MFA?

A) **Una story** “Autenticarme con Cognito (incluye MFA si aplica)”

B) **Dos stories** separadas: (1) usuario+contraseña Cognito (2) completar desafio MFA

C) Tres stories: password, MFA, y “reintentar / errores de auth”

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 4
¿Donde **publicamos** las stories nuevas?

A) **Append** al final de `aidlc-docs/inception/user-stories/stories.md` (nueva Feature / Epic)

B) Archivo aparte `aidlc-docs/inception/user-stories/stories-cognito-auth.md` y dejar el base intacto

C) Reemplazar/actualizar la Feature “Autenticacion” antigua (US-01 GitLab UI) para reflejar el modelo actual (Secret en memoria + Cognito)

X) Other (describe after [Answer]: below)

[Answer]: C

---

## Question 5
Nivel de detalle de **criterios de aceptacion**

A) Checklist corto (3–6 bullets) por story, en espanol, verificable en UI/API

B) Checklist detallado incluyendo mensajes de error esperados y “no se escribe secret en disco/logs”

C) Given/When/Then (formato BDD) por story

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
¿Incluimos story explicita de **fallo / denegacion** (credenciales invalidas, MFA incorrecto, API 401/403, Secret no disponible)?

A) Si — **una story** de errores de auth/config que agrupe esos casos

B) Si — criterios de error **dentro** de cada story principal (sin story aparte)

C) No — solo happy path en stories; errores solo en NFR/design

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 7
Prioridad de las stories de este delta

A) Todas **P0** (bloquean uso de la app)

B) Login+MFA+cargar config = **P0**; documentacion SAM / polish errores = **P1**

C) Seguir numeracion/prioridad del documento base sin marcar P0/P1 nuevo

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 8
Idioma y plantilla de las stories

A) Espanol; plantilla **Como / Quiero / Para** + Acceptance criteria (igual que `stories.md` actual)

B) Espanol; As a / I want / So that en ingles + AC en espanol

C) Ingles completo

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Resolved decisions (analysis 2026-08-04)

| Q | Answer | Interpretation for Part 2 |
|---|---|---|
| 1 | X | Solo **P-01**; el usuario Cognito **es** el colaborador funcional (actualizar contexto de persona; sin P-02 admin en Electron) |
| 2 | A | Orden **User Journey**: login(+MFA) → cargar config API → sesion en memoria → perfil |
| 3 | A | **Una** story de auth Cognito que incluye MFA |
| 4 | C | **Actualizar** Feature Autenticacion en `stories.md` (reemplazar modelo viejo GitLab-UI-creds) |
| 5 | A | AC checklist corto 3–6 bullets |
| 6 | B | Errores como AC **dentro** de cada story (no story aparte) |
| 7 | B | Stories bloqueantes auth/config = **P0**; docs SAM (si hay story) = **P1** |
| 8 | A | Espanol Como/Quiero/Para |

**Ambiguities:** None blocking. Q7 “polish errores” no crea story P1 separada porque Q6 mete errores en AC de las P0.

**Planned story set (draft for Part 2):**
1. US — Autenticarme con Cognito (usuario+password+MFA) — P0
2. US — Obtener configuracion (Secret) via API con JWT — P0
3. US — Usar config solo en memoria / no aws-credentials.json — P0
4. US — Tras auth, continuar a perfil nombre/apellido — P0
5. (Opcional P1) Documentacion SAM Wiki/context/postman — solo si se modela como story de valor; si no, queda en FR-20/construction

---

## Instructions

1. ~~Edit this file and fill every `[Answer]:` line.~~ Done
2. **Approve this plan** in chat to run Part 2 (generate/update stories + personas)
3. Or **Request Changes** to the resolved decisions above
