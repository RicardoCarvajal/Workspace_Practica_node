# Business Rules — unit-cognito-auth-electron

**Unit**: `unit-cognito-auth-electron`  
**Locale (Q7)**: Espanol (mensajes cortos)

## Auth gate

| ID | Rule |
|---|---|
| BR-E01 | Sin AccessToken valido en memoria **y** config cargada, la UI no muestra ProfileSetup ni repos/workspace/chat como disponibles. |
| BR-E02 | AuthLoginView se muestra **antes** de nombre/apellido (FR-17 / US-14). |
| BR-E03 | No hay MFA / TOTP en Electron. |
| BR-E04 | No hay registro (sign-up) de usuarios Cognito en la app. |
| BR-E05 | Electron **no** llama a Cognito directamente; solo al API base `AIDLC_CONFIG_API_URL` (Q0=A). |

## Credentials and config

| ID | Rule |
|---|---|
| BR-E10 | AccessToken y JSON `config` viven **solo en memoria del Main**; no persistir en disco ni userData. |
| BR-E11 | No crear ni leer `aws-credentials.json` en este flujo (FR-14 / Q4=A). |
| BR-E12 | Tras auth, no usar `.env` como fuente de secretos de app (Bedrock/GitLab); `.env` solo URL API (+ flags test) (Q5=A). |
| BR-E13 | El contenido del Secret no se muestra completo en UI ni se loguea en claro. |

## Login / password challenge

| ID | Rule |
|---|---|
| BR-E20 | Usuario y contrasena obligatorios; vacios → error de campo (no toast-only). |
| BR-E21 | Credenciales invalidas (API 401) → mensaje ES; no avanzar. |
| BR-E22 | `NEW_PASSWORD_REQUIRED` → UI de nueva contrasena (Q2=A); no se obtiene config hasta tokens. |
| BR-E23 | Nueva contrasena: requerida + confirmacion igual; fallos de politica Cognito → mensaje ES del API o generico. |
| BR-E24 | Sin "recordar password"; no hay remember-me de password (Q3=A). |

## Config fetch

| ID | Rule |
|---|---|
| BR-E30 | Tras tokens, siempre intentar `POST /config/session` antes de liberar el boot. |
| BR-E31 | 401/403 en config → limpiar token; volver a login; mensaje ES. |
| BR-E32 | 404 / Secret vacio → mensaje ES tipo "no se pudo cargar la configuracion"; no continuar como configurado. |
| BR-E33 | Fallo de red / 5xx → mensaje ES; reintento manual desde login o boton reintentar (sin bypass). |

## Logout

| ID | Rule |
|---|---|
| BR-E40 | Accion visible "Cerrar sesion" en topbar/menu (Q6=A). |
| BR-E41 | Logout limpia AccessToken + RuntimeConfigStore y fuerza AuthLoginView. |
| BR-E42 | Tras logout, operaciones que lean config fallan de forma controlada (no crash silencioso). |

## Error message examples (ES)

| Situation | Message (ejemplo) |
|---|---|
| Bad credentials | Credenciales invalidas. Verifica usuario y contrasena. |
| Config missing | No se pudo cargar la configuracion. Contacta al administrador. |
| Network | No hay conexion con el servicio de autenticacion. Intenta de nuevo. |
| New password mismatch | Las contrasenas no coinciden. |
| Session expired / 401 config | La sesion no es valida. Inicia sesion de nuevo. |
