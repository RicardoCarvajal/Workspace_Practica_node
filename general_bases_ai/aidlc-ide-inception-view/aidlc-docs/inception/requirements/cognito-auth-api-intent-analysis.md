# Intent Analysis — Auth Cognito + API SAM + Secret `.env` (delta)

| Campo | Valor |
|---|---|
| **User request** | Autenticacion previa a recoleccion de datos; API SAM; Secret con info del `.env`; guardar en memoria en Electron; trafico HTTPS. Correccion: **Amazon Cognito** (no Rekognition). |
| **Request type** | New Feature / Enhancement (brownfield desktop + nuevo backend SAM) |
| **Scope estimate** | Multiple components: carpeta SAM (`auth-api/`), Cognito, API Gateway HTTP API, Lambda, Secrets Manager; Electron (login Cognito, memoria, quitar formulario AWS local) |
| **Complexity estimate** | Moderate–Complex |
| **Requirements depth** | Standard–Comprehensive (seguridad + auth) |
| **Primary users** | Colaboradores funcionales que usan AIDLC inception view |

## Decisiones de aclaracion (resumen)

| Tema | Decision |
|---|---|
| Servicio auth | Cognito **User Pool** + **MFA** (no Rekognition / no camara) |
| Login UI | Usuario + contraseña en Electron (`InitiateAuth` / SDK) |
| API | HTTP API nueva, single-account, solo `dev`, `us-east-1` |
| Proteccion API | JWT authorizer Cognito → Lambda lee Secrets Manager → JSON tipo `.env` completo |
| Secret | Un secret JSON con mismas claves que `.env` |
| Electron storage | Solo memoria Main; autenticar en cada arranque |
| Orden | Cognito **antes** de nombre/apellido y demas recoleccion |
| Formulario AWS local | Eliminar (`aws-credentials.json` / prompt Access Key) |
| Usuarios Cognito | Gestion fuera de la app (admin/consola) |
| Docs SAM | Wiki.md, context.md, postman.json al implementar |
| Ubicacion SAM | Carpeta dentro de este repo |
