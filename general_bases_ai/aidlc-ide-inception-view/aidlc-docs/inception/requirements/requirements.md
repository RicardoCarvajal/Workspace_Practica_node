# Requirements — ATE AI-DLC IDE (Electron + React)

## Intent Analysis Summary

| Campo | Valor |
|---|---|
| **User request** | (Base) Desktop Electron + React: GitLab, inception, observaciones, chat Nova+RAG. **Delta 2026-08-03**: `logs/` + editar perfil. **Delta 2026-08-04**: autenticacion previa con **Amazon Cognito** (User Pool, **sin MFA**); API SAM (HTTP API) que, con JWT valido, devuelve el Secret (JSON tipo `.env`); Electron guarda solo en memoria; eliminar formulario/`aws-credentials.json` local de AWS. |
| **Request type** | Enhancement / New Feature on brownfield desktop app + new SAM backend |
| **Scope estimate** | Multiple components (Electron auth UI + Main memory config; SAM Cognito/API/Lambda/Secrets) |
| **Complexity estimate** | Moderate–Complex (auth delta); base app remains Complex |
| **Requirements depth** | Standard–Comprehensive (delta auth); Comprehensive (base) |
| **Primary users** | Colaboradores funcionales (negocio/producto) |
| **Auth delta intent doc** | `cognito-auth-api-intent-analysis.md` |

---

## 1. Product Vision

Aplicacion de escritorio para colaboradores funcionales que:

1. Se conectan a GitLab self-hosted (`https://git.intelix.biz/`) con credenciales de configuracion (local `.env` / embebidas al compilar para GitLab).
2. Listan los repositorios a los que tienen acceso.
3. Al elegir un repositorio, ven un **menu de modo** y luego trabajan solo sobre `aidlc-docs/inception/`.
4. **Modo Observaciones**: previsualizan Markdown, revisan cambios recientes y registran observaciones (archivo por nombre/apellido).
5. **Modo Chat**: analizan documentos con **Amazon Nova** usando RAG (embeddings Amazon + **LanceDB** embebida).
6. Push de observaciones a **`dev`**; pull a demanda (tambien refresca el indice vectorial).
7. Se distribuye como **ejecutable portable** Windows y **AppImage** Linux (**sin** instalador).

---

## 2. Functional Requirements

### FR-01 — Configuracion de conexion GitLab
- La URL base por defecto es `https://git.intelix.biz/`.
- **Desarrollo/pruebas**: URL, usuario y clave/PAT se leen de `.env` (no se piden en la UI si estan completos).
- **Compilacion release (`npm run dist`)**: lee `.env` y variables de entorno (`GITLAB_*`; opcional `AIDLC_EMBED_*` con prioridad) e **incrusta** esos valores en el proceso Main. Sin prompts interactivos.
- En la app empaquetada: las credenciales GitLab **no** son editables ni visibles como secretos en la UI; no se incluye `.env`.
- En runtime, las credenciales viven en memoria de sesion del Main (ademas del embed de build).

### FR-02 — Listado de repositorios
- Listar todos los repositorios accesibles por el usuario autenticado (GitLab API).
- Permitir buscar/filtrar por nombre.
- Mostrar metadatos basicos (nombre, path/namespace, descripcion si existe).
- Clic en la card del repo abre el flujo de seleccion de modo (FR-11); sin boton «Abrir» redundante.

### FR-03 — Alcance de contenido (solo Inception)
- Al abrir un repositorio, localizar `aidlc-docs/inception/`.
- Si no existe `aidlc-docs` o no existe `aidlc-docs/inception/`, mostrar estado de error claro.
- **No** mostrar el resto del repositorio ni otras fases (construction, operations, etc.).

### FR-04 — Navegacion y visualizacion
- Arbol de carpetas/archivos bajo `aidlc-docs/inception/`.
- Abrir archivos de texto/Markdown.
- Vista previa Markdown para archivos `.md`.
- UI en **espanol por defecto**.

### FR-05 — Cambios recientes de un archivo
- El usuario selecciona un archivo.
- Una accion muestra el cambio mas reciente de ese archivo (via API GitLab).
- Presentacion legible para no tecnicos.

### FR-06 — Panel de observaciones (por usuario)
- Panel en el workspace (modo Observaciones) para escribir observaciones sobre documentos de inception.
- Al primer inicio la app pide **nombre** y **apellido**; se guardan en userData. Tras el alta, el usuario **puede corregirlos** (ver FR-16).
- El encabezado muestra nombre y apellido (no el usuario de GitLab); el nombre es **clicable** para editar (FR-16).
- Al **agregar** una observacion (panel): pull automatico desde `dev`; se anade en `aidlc-docs/aidlc-state.md` del proyecto abierto, bajo `### INCEPTION PHASE`, una tarea en ingles `- [ ] Review observations <nombre-archivo.md>` (si la seccion existe, se anade la siguiente) con push a `dev`; la seccion legado `## Observaciones por revisar` se elimina si existe; la entrada de observacion queda en borrador local hasta cerrar.
- Las observaciones se **enumeran** (`## Observacion 1`, `## Observacion 2`, …).
- Directorio: `aidlc-docs/inception/observations/` (antes `observaciones/`; se sigue leyendo el directorio legado)
- Archivo propio: `observations-{nombre-apellido}-{n}.md` (numerado; al cerrar se publica y se abre el siguiente numero).
- Al **cerrar** el documento: **push directo a `dev`**, se oculta el preview y queda listo un archivo nuevo vacio.
- **Pull a demanda** («Actualizar»): trae observaciones de otras personas **y refresca el indice LanceDB** del proyecto (ver FR-13).
- Preview Markdown; inception es solo lectura en este modo.

### FR-07 — Publicacion a GitLab (push a `dev`)
- Observaciones se publican con push/commit a `dev` al cerrar el documento.
- Mostrar resultado (commit id / errores claros).

### FR-08 — Distribucion (sin instalador)
- Windows: ejecutable **portable**.
- Linux: **AppImage**.
- Empaquetado con Electron Builder; artefactos en `release/`.

### FR-09 — Obtencion de datos
- Contenido y metadatos via **API REST de GitLab** (sin clon local obligatorio).
- El indice LanceDB es almacenamiento local de embeddings (no sustituye a GitLab como fuente de verdad).

### FR-10 — Rama fija `dev`
- Lectura de arbol, archivos, preview, diffs, pull e indice: siempre desde `dev`.
- Si `dev` no existe, error claro.
- No selector de ramas en la UI (MVP).

### FR-11 — Menu de modo al escoger repositorio
- Tras seleccionar un repo valido, mostrar **pantalla intermedia a pantalla completa** con dos opciones:
  1. **Revisar documentos y hacer observaciones** → workspace modo Observaciones (arbol + preview + panel observaciones).
  2. **Chat de analisis** → workspace modo Chat (analisis RAG; ver FR-12).
- Permitir volver a la lista de repos y/o cambiar de modo (al menos volver atras al menu de modo o a la lista).

### FR-12 — Chat de analisis (Amazon Nova + RAG)
- Chat **solo para analisis y preguntas**; **no** modifica archivos de inception.
- Las respuestas deben **citar** documentos/fuentes del indice (rutas bajo inception) cuando aplique.
- Modelo de chat: **`amazon.nova-lite-v1:0`** en region **`us-east-1`** (salvo override documentado).
- Contexto recuperado desde LanceDB (top-k chunks relevantes al mensaje + historial de sesion en memoria).
- **Sesion de chat**: mientras la aplicacion permanezca abierta, conservar el historial del chat **por repositorio** (en memoria de proceso; se pierde al cerrar la app).
- Cada respuesta del asistente muestra citas cuando aplica. La conversion a observacion se hace solo desde el panel de observaciones (no hay boton en el chat).
- Mostrar estadistica de tokens: **ultimo mensaje** (input / output / total) **+ acumulado de la sesion** del repo mientras la app este abierta (Q8=A).

### FR-13 — Embeddings, LanceDB e indexacion
- Modelo de embeddings: **`amazon.titan-embed-text-v2:0`**.
- Base vectorial embebida: **LanceDB** en disco, **una carpeta por repositorio GitLab** bajo userData Electron (p. ej. `userData/lancedb/{projectId}/`) (Q10=A).
- Contenido a indexar: archivos **Markdown** bajo `aidlc-docs/inception/` **excluyendo** `aidlc-docs/inception/observations/` (y el legado `observaciones/`) (interpretacion de Q6=A).
- Al usar **«Actualizar (pull)»** (FR-06): ademas del pull de observaciones, **reindexar** inception → LanceDB para ese `projectId` (Q5=A).
- Si el indice no existe o esta vacio al entrar al modo Chat, construir/reindexar (con feedback de progreso/error).

### FR-14 — Credenciales AWS (Bedrock) y configuracion runtime
- **Tras Cognito + API (FR-17..FR-20)**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` y demas claves del `.env` llegan en el JSON del Secret y viven **solo en memoria** del Main.
- **Eliminado**: formulario de Access Key/Secret en setup y archivo `aws-credentials.json` en disco (Aclaracion 7=A / Q13=A).
- **`AWS_REGION`**: puede venir en el Secret; si el build tambien embebe region, documentar precedencia (Secret en runtime gana tras auth).
- Si faltan credenciales o Bedrock falla, error claro sin tumbar Observaciones.

### FR-15 — Logs de aplicacion en carpeta `logs/`
- Crear y usar la carpeta **`logs/`** en la **raiz del proyecto** `aidlc-ide-inception-view/` (Q1=A).
- Archivo principal de log (p. ej. `logs/app.log`) escrito por el proceso Main de Electron.
- Contenido: eventos de nivel **info**, **warn** y **error** — arranque, resultado de login, abrir repo, indexacion, pull, eventos de alto nivel de chat/RAG, y errores (Q3=B).
- Cuando el archivo alcance **~400 KB**, **vaciarlo / truncarlo** y continuar escribiendo desde cero (Q2=A).
- No registrar secretos (tokens, passwords, claves AWS, contenido completo de `.env`) (NFR-01 / SECURITY-03).
- Si no se puede crear/escribir `logs/` (permisos), fallar de forma segura: seguir operando la app y registrar el fallo solo en consola si aplica.

### FR-16 — Editar nombre y apellido del perfil
- El usuario puede corregir nombre y apellido despues del setup inicial.
- Entrada al flujo: **clic en el nombre** mostrado en la barra superior (topbar) (Q4=A).
- Formulario con las mismas validaciones que el alta (`validateUserProfile`); al guardar, actualizar `userData/user-profile.json` y el texto del encabezado de inmediato.
- Si el nuevo nombre cambia el slug del archivo de observaciones:
  - **No** renombrar ni borrar el archivo anterior.
  - Usar / crear un **archivo nuevo** (vacio o con encabezado estandar) para el nuevo slug (Q5=B).
- La actualizacion es **solo local** en este flujo; GitLab (`dev`) se actualiza en el siguiente push/cierre normal de observaciones (Q6=A).

### FR-17 — Autenticacion Cognito previa (Electron)
- Al arrancar la app, **antes** de nombre/apellido y de cualquier otra recoleccion de datos, el usuario debe autenticarse con **Amazon Cognito User Pool** (Aclaracion 4=A).
- UI propia en Electron: **usuario + contraseña** via SDK Cognito / `InitiateAuth` (Aclaracion 2=A).
- **Sin MFA** (decision 2026-08-04: MFA fuera de alcance).
- **No** hay Rekognition, camara ni biometria facial (Aclaracion 6=A).
- Usuarios Cognito se crean/gestionan **fuera** de esta app (consola/admin/script) (Aclaracion 5=A); sin sign-up en Electron en este delta.
- Sin sesion Cognito valida no se avanza al perfil ni al resto del flujo.
- Al cerrar la app se pierde la sesion en memoria; en el siguiente arranque hay que autenticar de nuevo.

### FR-18 — Backend SAM: API de configuracion (Secret)
- Proyecto SAM en **carpeta dentro de este repo** (Q5=A), modelo **single-account** (Q1=A).
- **API Gateway HTTP API nueva** en el stack (Q2=A, Q15=A).
- Region **`us-east-1`**; profile placeholder en `samconfig` (Q4=A).
- Entorno inicial: solo **`dev`** (Q3=A).
- Endpoint protegido con **JWT authorizer Cognito** (access/id token) (Aclaracion 3=A / Q14=C).
- Lambda (Python 3.13 preferido / estandares equipo): con JWT valido, lee **Secrets Manager** y responde el contenido de configuracion.
- Trafico en **HTTPS** (TLS) via API Gateway.

### FR-19 — Secrets Manager (contenido tipo `.env`)
- Un **secret JSON** con las **mismas claves** que el `.env` de la app (GitLab, AWS Bedrock, flags, etc.) (Q9=A, Q10=A).
- Valores cargados/mantenidos en deploy o consola (no hardcode en codigo).
- La Lambda obtiene el secret en runtime (cache en warm start segun estandares); **no** loguear el contenido del secret.

### FR-20 — Configuracion en memoria tras API
- Tras login Cognito, Electron llama a la API con el JWT, recibe el JSON del Secret y lo guarda **solo en memoria** del proceso Main (Q11=A).
- Esa configuracion alimenta GitLab embed/runtime y AWS Bedrock (reemplaza prompts locales y `aws-credentials.json`).
- Documentacion SAM del equipo: `documentation/Wiki.md`, `context.md`, `postman.json` al implementar (Q17=A).

---

## 3. Non-Functional Requirements

### NFR-01 — Seguridad
- Credenciales GitLab y AWS solo en sesion/memoria tras Cognito+API; no loguear secretos (SECURITY-03).
- HTTPS/TLS hacia GitLab, Cognito, API Gateway y AWS Bedrock (SECURITY-01 transit).
- Cognito User Pool **sin MFA** (usuario + contraseña).
- API de Secret solo con JWT Cognito valido (authorizer); minimo privilegio IAM en Lambda (`secretsmanager:GetSecretValue` al secret concreto).
- Validar entradas (rutas, mensajes de chat, projectId) (SECURITY-05).
- LanceDB local no almacena secretos AWS; solo chunks/embeddings de documentos de inception.
- Minimo privilegio: escritura GitLab limitada al flujo de observaciones acordado.

### NFR-02 — Usabilidad
- UI en espanol; menu de modo con lenguaje no tecnico.
- Chat: citas visibles; tokens visibles; conversion a observacion en un clic.
- Corregir nombre/apellido con un clic en el encabezado (FR-16), sin reiniciar la app.

### NFR-03 — Resiliencia / operacion (desktop)
| Decision | Valor |
|---|---|
| Criticidad | Medium / Low (herramienta interna) |
| RTO/RPO / DR | N/A desktop |
| Fallos Bedrock / LanceDB | Errores amigables; reintento en GET/pull donde sea seguro |
| Change management | N/A herramienta interna |
| Deployment | Portable / AppImage |

### NFR-04 — Observabilidad
- Logging estructurado en archivo bajo `logs/` (FR-15) con timestamp, nivel y mensaje; sin secretos.
- Truncado a ~400 KB (sin rotacion multi-archivo en MVP).
- Errores de red/API/Bedrock amigables en UI; detalles tecnicos en log de archivo cuando aplique.
- Desktop: log centralizado tipo cloud N/A; archivo local en raiz del proyecto es la fuente de observabilidad del MVP.

### NFR-05 — Empaquetado y plataformas
- Build Windows portable + Linux AppImage.
- Documentar variables AWS requeridas para el modo Chat.

### NFR-06 — Testing (PBT)
- Propiedades en logica pura: slug de perfil, chunking/paths de indice, parseo de citas, acumulacion de tokens, serializacion de mensajes de sesion.

---

## 4. Technical Constraints

| Area | Decision |
|---|---|
| Stack UI | Electron + React |
| Git server | GitLab self-hosted `https://git.intelix.biz/` |
| Auth Git | Username + password/PAT; desde Secret via API (memoria) / legacy embed build segun transicion |
| Auth app | Amazon Cognito User Pool (sin MFA); login UI en Electron |
| Config API | SAM single-account; HTTP API + JWT authorizer Cognito; Lambda + Secrets Manager |
| SAM location | Carpeta en este repo (p. ej. `auth-api/`) |
| Data access | GitLab REST API + LanceDB local |
| Content root | `aidlc-docs/inception/` only |
| Branch | Solo `dev` |
| Chat model | Amazon Nova Lite `amazon.nova-lite-v1:0` |
| Embeddings | Amazon Titan Embed Text v2 `amazon.titan-embed-text-v2:0` |
| Vector DB | LanceDB embedded, per `projectId` under Electron userData |
| AWS / GitLab runtime config | Secret JSON (claves tipo `.env`) en memoria tras Cognito+API; **sin** `aws-credentials.json` |
| Packaging | electron-builder: Win portable + Linux AppImage |
| i18n MVP | Espanol |
| AWS region (SAM) | `us-east-1`; entorno inicial `dev` |

---

## 5. Out of Scope (MVP)

- Edicion de archivos de inception desde el chat.
- Formulario local de Access Key/Secret AWS y persistencia `aws-credentials.json`.
- Amazon Rekognition / camara / biometria facial.
- Cognito Identity Pool (no solicitado; User Pool sin MFA).
- MFA / TOTP / SMS challenge en Cognito (fuera de alcance; decision 2026-08-04).
- Sign-up / registro de usuarios Cognito desde Electron.
- Persistencia del historial de chat entre reinicios de la app.
- Persistencia de sesion Cognito o del Secret en disco entre reinicios.
- Indexar `observaciones/` en LanceDB.
- Base vectorial unica global o compartida entre repos.
- Selector de ramas; clon git obligatorio.
- Visualizar construction/operations fuera de inception.
- Rotacion multi-archivo de logs / conservacion de historial tras truncar a 400 KB.
- Fallback automatico de `logs/` a userData (ubicacion fija: raiz del proyecto).
- Renombrar o migrar el archivo de observaciones antiguo al cambiar el slug; push/rename inmediato en GitLab al editar el perfil.
- Entornos qa/preprod/prod del stack auth (solo `dev` en este delta).

---

## 6. Acceptance Criteria (high level)

1. Con credenciales GitLab validas, la app lista repos.
2. Al elegir un repo, aparece pantalla de dos modos (Observaciones / Chat).
3. Modo Observaciones: solo inception; preview; observaciones por usuario; push a `dev` al cerrar.
4. Pull de observaciones refresca tambien el indice LanceDB del proyecto.
5. Modo Chat: Nova responde con analisis/citas; no edita inception.
6. Observaciones se agregan solo desde el panel de observaciones (sin boton en el chat).
7. Tokens del ultimo turno + acumulado de sesion visibles mientras la app siga abierta.
8. Historial de chat del repo se conserva hasta cerrar la aplicacion.
9. Sin AWS en `.env`, el modo Chat falla con mensaje claro; Observaciones sigue usable.
10. Build produce portable Windows + AppImage Linux.
11. Existe `logs/` en la raiz del proyecto; el log se trunca al superar ~400 KB; incluye eventos info/warn/error sin secretos.
12. Clic en el nombre del topbar permite editar nombre/apellido; el encabezado se actualiza al guardar.
13. Si cambia el slug, el archivo de observaciones anterior permanece; el nuevo slug usa archivo nuevo; GitLab no se actualiza hasta el push/cierre habitual.

---

## 7. Extension Compliance (Requirements stage)

### Security Baseline
| Rule | Status | Notes |
|---|---|---|
| SECURITY-01 | Compliant (planned) | TLS GitLab/Cognito/API Gateway/Bedrock; LanceDB sin secretos; config solo en memoria |
| SECURITY-02 | Compliant (planned) | HTTP API + JWT Cognito authorizer (delta auth) |
| SECURITY-03 | Compliant (planned) | Logging en `logs/` sin secretos/tokens; Secret no en logs de Lambda |
| SECURITY-04 | Partial | CSP renderer donde aplique |
| SECURITY-05 | Compliant (planned) | Validacion inputs; Cognito password auth |

### Resiliency Baseline
| Rule | Status | Notes |
|---|---|---|
| RESILIENCY-01.. | Compliant / N/A mix | Desktop; errores Bedrock/GitLab manejados en UI |

### Property-Based Testing
| Rule | Status | Notes |
|---|---|---|
| PBT-01+ | Deferred to design/code | Chunk paths, tokens, citations |

---

## 8. Traceability — Chat RAG questions (2026-08-03)

| Q | Answer | Requirement impact |
|---|---|---|
| Q1 | A | FR-11 pantalla intermedia dos tarjetas |
| Q2 | X — solo analisis, preguntas y citar | FR-12 analisis + citas; sin edicion |
| Q3 | A | Nova Lite |
| Q4 | A | Titan Embed Text v2 |
| Q5 | A | Pull observaciones tambien reindexa LanceDB |
| Q6 | A | MD bajo inception excl. `observaciones/` |
| Q7 | A | Convertir → borrador local sin push |
| Q8 | A | Tokens ultimo mensaje + acumulado sesion |
| Q9 | A | AWS solo `.env` / entorno |
| Q10 | A | LanceDB por `projectId` |
| Extensions | Ya habilitadas | Security, Resiliency, PBT |

---

## 9. Traceability — Logs + Edit Profile (2026-08-03)

| Q | Answer | Requirement impact |
|---|---|---|
| Q1 | A | FR-15 `logs/` en raiz del proyecto |
| Q2 | A | FR-15 truncar / vaciar al ~400 KB |
| Q3 | B | FR-15 info + warn + error |
| Q4 | A | FR-16 clic en nombre del topbar |
| Q5 | B | FR-16 archivo viejo intacto; archivo nuevo para slug nuevo |
| Q6 | A | FR-16 solo local; GitLab en push/cierre posterior |
| Extensions | Sin cambio | Security, Resiliency, PBT siguen enabled |

---

## 10. Traceability — Cognito Auth + SAM API + Secret (2026-08-04)

| Q / Aclaracion | Answer | Requirement impact |
|---|---|---|
| Q1 | A | FR-18 single-account SAM |
| Q2 | A | FR-18 HTTP API nueva |
| Q3 | A | FR-18 solo `dev` |
| Q4 | A | FR-18 `us-east-1` + profile placeholder |
| Q5 | A | FR-18 carpeta SAM en este repo |
| Q6–Q8, Q12, Q16 | X → Cognito | Fuera Rekognition; ver Aclaraciones |
| Q9 | A | FR-19/FR-20 respuesta = contenido completo del Secret |
| Q10 | A | FR-19 un JSON con claves tipo `.env` |
| Q11 | A | FR-20 solo memoria Main |
| Q13 | A | FR-14 eliminar formulario/`aws-credentials.json` |
| Q14 | C | FR-18 JWT authorizer Cognito |
| Q15 | A | FR-18 HTTPS via API Gateway |
| Q17 | A | FR-20 docs Wiki/context/postman |
| Aclaracion 1 | X — A con MFA (hist.) | **Superseded 2026-08-04**: sin MFA |
| Aclaracion 2 | A | FR-17 UI usuario+password Electron |
| Aclaracion 3 | A | FR-18 JWT authorizer → Lambda → Secrets Manager |
| Aclaracion 4 | A | FR-17 Cognito antes de nombre/apellido |
| Aclaracion 5 | A | FR-17 usuarios fuera de la app |
| Aclaracion 6 | A | Out of scope: Rekognition/camara |
| Aclaracion 7 | A | Confirma Q13 / FR-14 |
| Extensions | Sin cambio | Security, Resiliency, PBT siguen enabled |
