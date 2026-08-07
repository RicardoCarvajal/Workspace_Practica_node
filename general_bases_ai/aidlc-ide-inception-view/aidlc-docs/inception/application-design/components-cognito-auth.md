# Components — Cognito Auth + SAM API (delta)

**Architecture style (Q8=B):** Minimal — Lambda thin handler; Electron auth UI + Main memory store.  
**Cognito (Q1=A):** Solo en Electron Main. Renderer = formularios + IPC.

## Electron (desktop)

### CognitoLoginView
- **Purpose**: Pantalla de arranque (usuario, contrasena, codigo TOTP MFA)
- **Responsibilities**: Capturar input; invocar IPC de auth; mostrar errores; no persistir password
- **Interfaces**: IPC `aidlc:cognito-*` via preload

### CognitoAuthMain
- **Purpose**: Cliente Cognito en Main (`InitiateAuth`, MFA challenge)
- **Responsibilities**: Autenticar; manejar desafio SOFTWARE_TOKEN_MFA; exponer access token en memoria de sesion; logout limpia tokens
- **Interfaces**: Cognito User Pool API; IPC handlers

### RuntimeConfigStore (Main, memory-only)
- **Purpose**: Guardar JSON del Secret tras `POST /config/session`
- **Responsibilities**: set/get/clear config; alimentar GitLab/Bedrock; nunca escribir `aws-credentials.json`
- **Interfaces**: In-memory map/object; leido por `load-config` / `aws-config` / GitLab clients

### ConfigApiClient (Main)
- **Purpose**: Llamar HTTP API con Access Token
- **Responsibilities**: `POST /config/session`; mapear errores 401/403/5xx a errores de app
- **Interfaces**: HTTPS API Gateway

### AppBootOrchestrator
- **Purpose**: Orden de arranque FR-17
- **Responsibilities**: Cognito → config API → memoria → ProfileSetup / app; bloquear si falla
- **Interfaces**: Coordina vistas + stores

### LegacyAwsCredentialsPrompt (retirar)
- **Purpose**: (Deprecado) formulario Access Key + `aws-credentials.json`
- **Responsibilities**: Eliminar del boot path (FR-14)

## SAM (`auth-api/`)

### AidlcAuthUserPool
- **Purpose**: Cognito User Pool + App Client con MFA TOTP
- **Responsibilities**: Identidades de usuarios funcionales; emitir tokens; sin sign-up en Electron
- **Interfaces**: Cognito hosted APIs (usado por Main)

### AidlcConfigHttpApi
- **Purpose**: HTTP API + JWT authorizer (Access Token)
- **Responsibilities**: Exponer `POST /config/session`; rechazar sin JWT valido
- **Interfaces**: API Gateway HTTP API v2

### ConfigSessionFunction (Lambda)
- **Purpose**: Devolver contenido del Secret
- **Responsibilities**: `GetSecretValue`; responder JSON plano del `.env`-shape; no loguear secret
- **Interfaces**: Secrets Manager; HTTP response

### AidlcAppConfigSecret
- **Purpose**: Secrets Manager con claves tipo `.env`
- **Responsibilities**: Almacenar GitLab/AWS/flags; valor mantenido en deploy/consola
- **Interfaces**: Secrets Manager API
