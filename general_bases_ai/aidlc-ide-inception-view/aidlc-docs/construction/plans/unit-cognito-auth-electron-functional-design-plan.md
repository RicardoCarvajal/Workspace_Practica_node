# Functional Design Plan — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Code root**: `electron-app/`  
**Stories**: US-01, US-02 (client), US-13, US-14, US-15  
**Prior**: unit-auth-api-sam code approved; **MFA OFF**  
**Infra Design**: SKIP for this unit (desktop)

## Part 2 checklist

- [x] `business-logic-model.md`
- [x] `business-rules.md`
- [x] `domain-entities.md`
- [x] `frontend-components.md`
- [x] Present Functional Design Complete

---

## Questions — fill every `[Answer]:`

---

## Question 0 (arquitectura — priorizar)
¿Como autentica Electron al usuario?

A) **Solo via API** (tu preferencia): Electron envia usuario/contraseña a un endpoint del SAM (p. ej. `POST /auth/login`). La **Lambda** habla con Cognito. Electron **no** usa User Pool Id / Client Id. Solo necesita la **URL base del API**. Tras login, pide config (mismo token de sesion o flujo que definamos).

B) **Electron → Cognito directo** (diseno inception actual): Electron usa User Pool Id + Client Id, obtiene JWT, llama `POST /config/session` con Authorization Bearer. Cognito valida en API Gateway JWT authorizer.

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 1
¿De donde lee Electron la URL del API (y, **solo si Q0=B**, Pool Id / Client Id)?

A) Variables en `.env` / bake en `npm run dist` (si Q0=A: solo `AIDLC_CONFIG_API_URL`; si Q0=B: tambien Pool/Client)

B) Archivo de config local no secreto (JSON en userData) editable una vez

C) Hardcode de valores de stack `devate-aidlc-auth-api` solo para MVP (documentar cambio luego)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2
Si Cognito responde **NEW_PASSWORD_REQUIRED** (usuario con temp password)

A) Pantalla en Electron para definir nueva contraseña (Electron o API segun Q0) y luego continuar al fetch de config

B) Mostrar error pidiendo que el admin deje la cuenta lista; sin UI de cambio de password en MVP

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3
Tras quitar MFA, el login Electron es

A) Solo usuario + contraseña → (segun Q0: API login o Cognito) → config en memoria → perfil/app

B) Usuario + contraseña; opcional “recordar usuario” (no password) en disco

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 4
Retiro de **`aws-credentials.json`** y prompt AWS (FR-14)

A) Eliminar UX + store + IPC de credenciales locales; Bedrock/GitLab solo desde RuntimeConfigStore tras auth

B) Dejar codigo muerto comentado un release; no mostrar UI

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5
¿Que pasa con **`AIDLC_DEV_MODE`** y `.env` local en desarrollo?

A) Tras auth, siempre Secret en memoria; `.env` solo aporta URL del API (y Pool/Client si Q0=B) + flags de test repo si aplica

B) Si `AIDLC_DEV_MODE=true`, bypass auth y usar `.env` completo (solo si lo confirmas)

C) Auth siempre; en dev se apunta la URL del API (y Pool/Client si Q0=B) al stack `dev` via `.env` (sin bypass)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6
Accion **cerrar sesion** (US-15)

A) Boton en topbar / menu; limpia sesion + RuntimeConfigStore y vuelve a login

B) Solo al cerrar la app (quit); sin boton en MVP

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 7
Idioma de errores de login/config

A) Espanol, mensajes cortos (credenciales invalidas, no se pudo cargar configuracion, etc.)

B) Ingles

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Instructions

1. Rellena cada `[Answer]:` en este archivo (empieza por **Question 0**).
2. Escribe **listo** en el chat.

**Nota**: Si eliges **Q0=A**, habra que ampliar `auth-api` (endpoint de login + Cognito desde Lambda) en construction; Electron solo conocera la URL del API.
