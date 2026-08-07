# User Stories — ATE AI-DLC IDE

**Persona primaria:** P-01 Colaborador funcional (usuario Cognito = mismo perfil funcional)  
**Organizacion:** Feature + **User Journey** en Auth (arranque)  
**Idioma:** Espanol  
**Rama fija:** `dev`  
**Prioridad:** P0 = bloquea uso / MVP; P1 = chat, MR, docs SAM auth  
**Delta 2026-08-04:** Feature Autenticacion actualizada a Cognito + API Secret (FR-14, FR-17..FR-20)

---

## Feature: Autenticacion Cognito + Config (FR-14, FR-17..FR-20) — User Journey

Orden de lectura = arranque: login Cognito → config API → memoria → perfil.

### US-01 — Autenticarme con Cognito
**Como** colaborador funcional  
**Quiero** iniciar sesion con usuario y contrasena Cognito  
**Para** demostrar que soy un usuario autorizado antes de usar la app  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-17, NFR-01

**Acceptance criteria:**
- [ ] Al arrancar, veo la pantalla de login Cognito **antes** de nombre/apellido u otros datos
- [ ] Puedo autenticarme con usuario y contrasena (sin MFA)
- [ ] Con credenciales invalidas veo un error claro y **no** avanzo
- [ ] Sin sesion Cognito valida no puedo continuar al resto de la app
- [ ] No hay captura de rostro ni Rekognition

### US-02 — Obtener la configuracion (Secret) via API
**Como** colaborador funcional  
**Quiero** que, tras autenticarme, la app obtenga la configuracion tipo `.env` desde la API  
**Para** conectar a GitLab y AWS sin cargar secretos a mano  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-18, FR-19, FR-20

**Acceptance criteria:**
- [ ] Tras Cognito exitoso, la app llama a la API con el JWT y recibe el JSON del Secret
- [ ] Si la API responde 401/403 o el Secret no esta disponible, veo un error claro y no continuo como si estuviera configurado
- [ ] El contenido del Secret no se muestra completo en la UI ni en logs

### US-13 — Usar la configuracion solo en memoria
**Como** colaborador funcional  
**Quiero** que las claves (GitLab, AWS, etc.) vivan solo mientras la app esta abierta  
**Para** no dejar `aws-credentials.json` ni secretos en disco por este flujo  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-14, FR-20, NFR-01

**Acceptance criteria:**
- [ ] Tras cargar el Secret, GitLab/Bedrock usan la config en memoria del Main
- [ ] No se crea ni se usa `aws-credentials.json` ni formulario local de Access Key/Secret en este flujo
- [ ] Al cerrar la app, en el siguiente arranque debo autenticarme otra vez (no hay sesion persistida de Cognito/Secret)

### US-14 — Continuar al perfil tras autenticacion
**Como** colaborador funcional  
**Quiero**, una vez autenticado y con config cargada, registrar o usar mi nombre y apellido  
**Para** trabajar con observaciones y el resto de la app  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-17, FR-16 (orden)

**Acceptance criteria:**
- [ ] Solo despues de Cognito + config exitosos puedo ver el flujo de nombre/apellido (o la app principal si el perfil ya existe)
- [ ] Si falla auth o config, no se muestra el formulario de perfil como si estuviera listo
- [ ] El usuario Cognito es el colaborador funcional (mismo P-01); no hay registro de usuarios Cognito en la app

### US-15 — Cerrar sesion y limpiar memoria
**Como** colaborador funcional  
**Quiero** cerrar sesion  
**Para** limpiar tokens Cognito y la configuracion en memoria  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-17, FR-20, NFR-01

**Acceptance criteria:**
- [ ] Existe una accion de cerrar sesion (si aplica en la UI del MVP)
- [ ] Tras cerrar, no puedo listar repos ni usar Chat hasta volver a autenticarme
- [ ] Tokens y Secret dejan de estar disponibles en la sesion

### US-16 — Documentacion del API SAM de auth (P1)
**Como** colaborador funcional / equipo que opera el API  
**Quiero** documentacion Wiki, context y Postman del stack auth  
**Para** desplegar y probar el endpoint de configuracion  

**Prioridad:** P1 | **Persona:** P-01 | **Req:** FR-20, Q17

**Acceptance criteria:**
- [ ] Existen `documentation/Wiki.md`, `context.md` y `postman.json` del proyecto SAM auth
- [ ] Describen el flujo Cognito → JWT → API → Secret a alto nivel

---

## Feature: Repositorios (FR-02, FR-10)

### US-03 — Listar repositorios accesibles
**Como** colaborador funcional  
**Quiero** ver todos los repositorios a los que tengo acceso  
**Para** elegir en cual revisar la documentacion de inception  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-02

**Acceptance criteria:**
- [ ] Se listan los repositorios accesibles via API GitLab
- [ ] Puedo filtrar/buscar por nombre
- [ ] Si la API falla, veo un error claro

### US-04 — Abrir repositorio solo en rama `dev`
**Como** colaborador funcional  
**Quiero** que al abrir un repositorio se use siempre la rama `dev`  
**Para** no tener que elegir ramas ni ver otras lineas de trabajo  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-10

**Acceptance criteria:**
- [ ] Al abrir un repo, el contenido se lee desde la rama `dev`
- [ ] No hay selector de ramas en la UI
- [ ] Si la rama `dev` no existe, veo un error claro y no se muestra el arbol

---

## Feature: Viewer Inception (FR-03, FR-04, FR-09)

### US-05 — Mostrar solo `aidlc-docs/inception/`
**Como** colaborador funcional  
**Quiero** ver unicamente la carpeta `aidlc-docs/inception/`  
**Para** concentrarme en la documentacion de la fase inception  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-03, FR-09

**Acceptance criteria:**
- [ ] El arbol mostrado esta limitado a `aidlc-docs/inception/`
- [ ] No se muestran construction, operations ni otras carpetas del repo
- [ ] Si no existe `aidlc-docs/inception/`, veo un mensaje de error claro

### US-06 — Navegar y abrir archivos de inception
**Como** colaborador funcional  
**Quiero** navegar carpetas y abrir archivos de texto  
**Para** leer la documentacion  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-04

**Acceptance criteria:**
- [ ] Puedo expandir/colapsar carpetas bajo inception
- [ ] Al seleccionar un archivo de texto se muestra su contenido desde `dev`
- [ ] Si falla la carga del archivo, veo un error claro

### US-07 — Vista previa Markdown
**Como** colaborador funcional  
**Quiero** ver archivos `.md` con formato legible  
**Para** revisar requisitos e historias con comodidad  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-04

**Acceptance criteria:**
- [ ] Los `.md` se renderizan en vista previa
- [ ] Puedo distinguir al menos titulo, listas y enlaces basicos
- [ ] Si el archivo no es `.md`, no se fuerza preview Markdown

---

## Feature: Cambios recientes (FR-05)

### US-08 — Ver cambios mas recientes de un archivo
**Como** colaborador funcional  
**Quiero** un boton que muestre que cambio mas recientemente en el archivo seleccionado  
**Para** entender la ultima modificacion sin comparar ramas manualmente  

**Prioridad:** P0 | **Persona:** P-01 | **Req:** FR-05, FR-10

**Acceptance criteria:**
- [ ] Con un archivo seleccionado, existe una accion "cambios recientes" (o equivalente en espanol)
- [ ] Se muestra un diff legible del cambio mas reciente de ese archivo en `dev`
- [ ] Si no hay historial / no se puede obtener el diff, veo un error o mensaje claro
- [ ] La operacion usa la rama `dev`

---

## Feature: Chat Gemini (FR-06) — P1

### US-09 — Chatear con Gemini sobre inception
**Como** colaborador funcional  
**Quiero** un chat integrado que use Gemini  
**Para** pedir aclaraciones o cambios sobre la documentacion de inception  

**Prioridad:** P1 | **Persona:** P-01 | **Req:** FR-06, NFR-01

**Acceptance criteria:**
- [ ] Existe un panel de chat en la app
- [ ] La API key se toma de entorno/`.env` (no se pide en la UI)
- [ ] Si falta la API key o Gemini falla, veo un error claro
- [ ] El chat no escribe fuera de `aidlc-docs/inception/`

### US-10 — Aplicar ediciones de Gemini en la sesion
**Como** colaborador funcional  
**Quiero** que Gemini edite archivos de inception en la sesion de la app  
**Para** revisar el resultado antes de publicarlo  

**Prioridad:** P1 | **Persona:** P-01 | **Req:** FR-06

**Acceptance criteria:**
- [ ] Tras una peticion de cambio, el contenido del archivo en la UI se actualiza en sesion
- [ ] Puedo revisar el archivo modificado antes de publicar
- [ ] Sin confirmacion de publicacion, los cambios no se suben a GitLab

---

## Feature: Publicacion GitLab (FR-07, FR-10) — P1

### US-11 — Confirmar commit, push y Merge Request hacia `dev`
**Como** colaborador funcional  
**Quiero** confirmar la publicacion de mis cambios  
**Para** crear un Merge Request hacia la rama `dev` sin usar git en terminal  

**Prioridad:** P1 | **Persona:** P-01 | **Req:** FR-07, FR-10

**Acceptance criteria:**
- [ ] Existe una confirmacion explicita antes de publicar
- [ ] Tras confirmar, se crea commit en una rama de trabajo basada en `dev`
- [ ] Se crea Merge Request con destino `dev`
- [ ] Se muestra el resultado (enlace al MR o error claro)
- [ ] No se publica a otras ramas base distintas de `dev`

---

## Feature: Empaquetado (FR-08)

### US-12 — Distribuir instaladores Windows y Linux
**Como** colaborador funcional  
**Quiero** instalar la aplicacion en Windows o Linux  
**Para** usarla sin configurar un entorno de desarrollo  

**Prioridad:** P0 (habilitacion) | **Persona:** P-01 | **Req:** FR-08, NFR-05

**Acceptance criteria:**
- [ ] Existe instalador Windows NSIS (`.exe`)
- [ ] Existen paquetes Linux AppImage y `.deb`
- [ ] La documentacion de build describe como generarlos

---

## Mapa persona → historias

| Persona | Historias |
|---|---|
| P-01 Colaborador funcional | US-01, US-02, US-03 … US-16 |

## Cobertura de requisitos

| Req | Historias |
|---|---|
| FR-01 (GitLab runtime) | US-02, US-13 (creds via Secret) |
| FR-02 | US-03 |
| FR-03 | US-05 |
| FR-04 | US-06, US-07 |
| FR-05 | US-08 |
| FR-06 | US-09, US-10 |
| FR-07 | US-11 |
| FR-08 | US-12 |
| FR-09 | US-05, US-06 |
| FR-10 | US-04, US-08, US-11 |
| FR-14 | US-13 |
| FR-16 | US-14 (orden post-auth) |
| FR-17 | US-01, US-14, US-15 |
| FR-18 | US-02 |
| FR-19 | US-02 |
| FR-20 | US-02, US-13, US-16 |
| NFR-01 | US-01, US-02, US-13, US-15 |

## Notas INVEST
- Historias pequenas e independientes por capacidad del journey de auth
- Valiosas para el colaborador funcional (P-01 = usuario Cognito)
- Estimables y testeables via acceptance criteria (3–6 bullets; errores embebidos)
- P0 auth bloquea el uso; US-16 docs SAM es P1
- Feature Autenticacion (2026-08-04) reemplaza el modelo antiguo de login GitLab en UI
