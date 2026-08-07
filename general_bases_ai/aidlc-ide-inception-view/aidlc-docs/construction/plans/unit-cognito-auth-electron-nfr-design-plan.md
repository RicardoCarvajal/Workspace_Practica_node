# NFR Design Plan — unit-cognito-auth-electron

**Prior**: NFR Requirements approved (fetch, 15s, no retry, TLS, memory, SAM delta before Electron CG)  
**Next after this stage**: Infrastructure Design — **SKIP** → then Code Generation (SAM `/auth/*` first)

## Part 2 checklist

- [x] `nfr-design-patterns.md`
- [x] `logical-components.md`
- [x] Present NFR Design Complete

## Resolved decisions

| Q | Answer | Meaning |
|---|---|---|
| 1 | A | Config fail → clear token; re-login |
| 2 | A | Disable submit; one IPC |
| 3 | A | Single config load; store only |
| 4 | A | Generic ES errors; no raw body |
| 5 | A | Bake API URL |
| 6 | A | Simple Main modules |
| 7 | B | Block second login until logout |
| 8 | A | Code Gen: auth-api delta then Electron |

---

## Questions — fill every `[Answer]:`

---

## Question 1 — Resilience
Si `POST /auth/login` responde 200 con tokens pero `POST /config/session` falla

A) Limpiar AccessToken; mostrar error ES de config; usuario permanece en login (o pantalla de error con “Reintentar” que vuelve a pedir password)

B) Conservar AccessToken en memoria y mostrar UI “Reintentar cargar configuracion” **sin** volver a pedir password

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 2 — Resilience / double-submit
Patron anti doble click en login

A) Deshabilitar boton Submit mientras `submitting=true` (FD); un solo IPC en vuelo por intento

B) Ademas debounce 300 ms en el handler UI

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 3 — Performance
¿Cache local del resultado de `/config/session` dentro de la misma sesion?

A) No; una sola carga al login; `RuntimeConfigStore` es la unica cache en memoria hasta logout

B) TTL corto (p. ej. 5 min) y refresh automatico en background (mayor complejidad)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 4 — Security
Mapeo de errores HTTP a mensajes ES en UI

A) Mensajes genericos por familia (401 credenciales, 404 config, red/5xx generico); **no** mostrar body crudo del API

B) Preferir body plain-text del API si es corto y seguro; fallback generico

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 5 — Security
Donde vive `AIDLC_CONFIG_API_URL` en builds empaquetados

A) Bake en build (`define` / `.env` embebido en dist); sin UI para cambiarlo en MVP

B) Editable en Settings avanzados (userData JSON) ademas del bake

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 6 — Logical components
Estructura Main del path auth

A) Modulos claros: `AuthApiClient`, `AuthSessionStore`, `RuntimeConfigStore`, `AuthIpcHandlers` (sin hexagonal pesado)

B) Hexagonal light (`application/` + `infrastructure/`) dentro de Electron Main

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Question 7 — Scalability (desktop)
Sesiones

A) Una sesion por proceso Main; segundo login reemplaza la anterior (logout implicito)

B) Bloquear segundo login si ya hay sesion (forzar logout explicito primero)

X) Other (describe after [Answer]: below)

[Answer]: B

---

## Question 8 — Code Gen order (confirm Q7 NFR Req)
Al entrar en Code Generation de esta unidad

A) **Part 1 plan** incluye primero delta `auth-api` (`/auth/login`, `/auth/respond-new-password` + tests/docs) y luego `electron-app`

B) Code Gen Electron asume API ya desplegada y solo documenta el contrato (delta SAM en tarea separada fuera de este plan)

X) Other (describe after [Answer]: below)

[Answer]: A

---

## Instructions

1. Rellena cada `[Answer]:` en este archivo.
2. Escribe **listo** en el chat.
