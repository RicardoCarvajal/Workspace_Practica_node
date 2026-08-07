# NFR Requirements Plan — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Code root**: `electron-app/`  
**FD lock**: API-only auth (Q0=A); memory config; no Cognito SDK in Electron; ES errors  
**Dependency**: SAM debe exponer `/auth/login` + `/auth/respond-new-password` (+ existente `/config/session`)  
**Next**: NFR Design (luego Code Gen; Infra SKIP)

## Part 2 checklist

- [x] `nfr-requirements.md`
- [x] `tech-stack-decisions.md`
- [x] Present NFR Requirements Complete

## Resolved decisions

| Q | Answer | Meaning |
|---|---|---|
| 1 | A | fetch nativo |
| 2 | A | timeout 15 s |
| 3 | A | sin reintentos auto |
| 4 | A | TLS estandar |
| 5 | A | log eventos con redaction |
| 6 | A | unit tests + checklist manual |
| 7 | A | delta SAM **antes** de Electron CG |
| 8 | A | token solo memoria Main |
| 9 | B | toggle show/hide password |

---

## Questions — fill every `[Answer]:`

---

## Question 1
Cliente HTTP en Electron Main hacia el auth-api

A) `fetch` nativo (Node/Electron) sin libreria extra

B) Axios (si ya esta en el proyecto Main) o anadir axios solo en Main

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Timeout por llamada HTTP (login / new-password / config)

A) 15 s

B) 30 s

C) 10 s

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3
Reintentos automaticos ante fallo de red / 5xx

A) Ninguno; el usuario reintenta desde la UI

B) 1 reintento automatico solo en `GET`-equivalente / idempotente — aqui **solo** en `POST /config/session` si ya hay token (login password **sin** retry auto)

C) 1 reintento en login y config

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 4
TLS / certificados al llamar el API

A) Validacion TLS estandar (sistema); sin bypass `NODE_TLS_REJECT_UNAUTHORIZED`

B) Permitir override solo en dev con flag explicito (documentado)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
Logging en Main (auth path)

A) Loguear eventos (login ok/fail, config ok/fail) **sin** password, token ni body del Secret

B) Solo errores, mismo redaction

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
Pruebas de esta unidad (Electron)

A) Unit tests de AuthApiClient / RuntimeConfigStore (mock HTTP) + checklist manual login UI

B) Solo checklist manual en MVP

C) Incluir e2e Playwright/Spectron (mayor esfuerzo)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 7
Cuando implementar el **delta SAM** (`/auth/login`, `/auth/respond-new-password`)

A) **Antes** del Code Gen Electron: ampliar `auth-api` (mini delta en construction) y luego Electron

B) En el **mismo** Code Gen de esta unidad: tocar `auth-api/` + `electron-app/` juntos

C) Electron primero con mocks; SAM auth endpoints en un follow-up aparte

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 8
Almacenamiento de AccessToken en Main

A) Variable/modulo en memoria del proceso Main (ya locked FD); sin keytar / sin disk

B) keytar / OS keychain (contrario a US-13 “no sesion persistida” — solo si lo confirmas)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 9
Usabilidad login (MVP)

A) Campos claros + errores inline ES; sin “show password” obligatorio

B) Incluir toggle mostrar/ocultar contrasena

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Instructions

1. Rellena cada `[Answer]:` en este archivo.
2. Escribe **listo** en el chat.
