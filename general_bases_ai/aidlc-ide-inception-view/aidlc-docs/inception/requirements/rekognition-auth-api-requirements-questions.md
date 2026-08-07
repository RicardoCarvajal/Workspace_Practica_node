# Preguntas de aclaracion — Auth previa (Rekognition) + API SAM + Secret `.env`

Responde cada pregunta rellenando la etiqueta `[Answer]:` (letra de la opcion, o X con una descripcion breve).

**Contexto del pedido**: autenticacion previa a la recoleccion de datos (nombre/apellido y/o AWS); API SAM con Amazon Rekognition; respuesta con la informacion del `.env` desde Secrets Manager; guardar en la app **solo en memoria** (volver a pedir en cada arranque); trafico cifrado (HTTPS).

---

## Pregunta 1
¿Que modelo de despliegue AWS debe usar el proyecto SAM?

A) Single-account: un `template.yaml` (y `samconfig.toml`) en una carpeta del repo o stack unico

B) Cross-account ATE ↔ EWM: carpetas `ATE/` (API Gateway) + `EWM/` (Lambdas); desplegar EWM primero

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 2
¿La API Gateway debe ser nueva o reutilizar una existente?

A) Crear una API nueva en este stack (HTTP API o REST API Serverless)

B) Adjuntar metodos a la API interna existente (parametros SSM tipo `restApiIdInternal` / recurso padre)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 3
¿En que entornos se debe desplegar esta API?

A) Solo `dev` por ahora

B) `dev` y `qa`

C) `dev`, `qa`, `preprod` y `prod` (todas las secciones en `samconfig.toml`)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 4
¿Region AWS y (si aplica) profile de despliegue preferidos?

A) `us-east-1` (Virginia); profile a definir en `samconfig` / documentacion (placeholder)

B) `us-east-1` y un profile concreto (indica el nombre despues de [Answer]: , p. ej. `X) profile=sapEpa`)

C) Otra region (indica region y profile despues de [Answer]:)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 5
¿Donde debe vivir el codigo SAM respecto a este repo Electron (`aidlc-ide-inception-view`)?

A) Carpeta dentro de este mismo repo (p. ej. `auth-api/` o `infrastructure/auth/`)

B) Proyecto/carpeta hermano fuera de este repo (ruta a indicar)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 6
¿Que flujo de Amazon Rekognition debe autenticar al usuario?

A) Comparar rostro contra una **Face Collection** ya enrolada (`SearchFacesByImage` / similar) — solo usuarios registrados

B) Comparar dos imagenes (`CompareFaces`): foto de referencia guardada vs captura en vivo

C) Solo `DetectFaces` (hay un rostro vivo) — sin comparar identidad (mas debil)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: X me equivoque de servicio es AWS cognito

---

## Pregunta 7
Si hay enrolamiento de rostros (coleccion o foto de referencia), ¿como se gestionan?

A) Fuera de esta app (proceso admin / consola / script aparte); la app solo autentica

B) Incluir en este trabajo un endpoint o flujo minimo de enrolamiento

C) Un solo rostro de referencia fijo en S3/Secrets (sin coleccion multi-usuario)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: X me equivoque de servicio es AWS cognito

---

## Pregunta 8
¿Como captura la app Electron la imagen para autenticar?

A) Camara del dispositivo (getUserMedia) en una pantalla de login facial

B) El usuario selecciona/sube un archivo de imagen

C) Ambas opciones (camara por defecto + subir archivo)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: X me equivoque de servicio es AWS cognito

---

## Pregunta 9
¿Que debe devolver la API tras autenticacion exitosa?

A) Todo el contenido del Secret (equivalente al `.env` completo: GitLab, AWS Bedrock, flags, etc.)

B) Solo un subconjunto (p. ej. GitLab + AWS Bedrock; sin flags de build)

C) Estructura tipada (JSON con campos conocidos), no el texto plano del `.env`

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 10
¿Como se materializa el Secret en AWS Secrets Manager?

A) Un secret JSON con las mismas claves que el `.env` de la app (valores rellenados en deploy / consola)

B) Un secret con el `.env` como un unico string (blob)

C) Varios secrets separados (p. ej. GitLab vs AWS) y la Lambda los combina

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 11
Tras recibir la respuesta, ¿donde guarda Electron esa informacion?

A) Solo en memoria del proceso Main (se pierde al cerrar la app; hay que autenticar en cada arranque) — como pediste

B) Memoria + opcional keychain/OS (persistir entre reinicios)

C) Sustituir el actual `aws-credentials.json` en disco por este flujo (persistente)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 12
¿Cuando debe ejecutarse esta autenticacion facial en la app?

A) Siempre al arrancar, **antes** de nombre/apellido y de cualquier otra recoleccion de datos

B) Solo cuando `AIDLC_DEV_MODE=false` (en `true` seguir con env/.env local sin Rekognition)

C) Siempre al arrancar, pero en `AIDLC_DEV_MODE=true` permitir bypass con flag/documentado

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: X me equivoque de servicio es AWS cognito

---

## Pregunta 13
Con este flujo, ¿que pasa con el formulario actual de Access Key / Secret (`AIDLC_DEV_MODE=false` + `aws-credentials.json`)?

A) Eliminarlo: las claves AWS (y demas) vienen solo de la API tras Rekognition

B) Mantenerlo como fallback si la API no esta disponible

C) Mantenerlo solo en desarrollo local; builds empaquetados solo API + Rekognition

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 14
¿Como se protege el endpoint ademas de HTTPS (TLS)?

A) Solo HTTPS + validacion Rekognition en el body (imagen); sin API Key / JWT adicional

B) HTTPS + API Key (o header compartido) que la app embebida conoce

C) HTTPS + authorizer Cognito / JWT de usuario

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Pregunta 15
¿Tipo de API Gateway preferido para este servicio?

A) HTTP API (API Gateway v2) — mas simple/barato para un POST de auth

B) REST API (API Gateway v1) — alineado con APIs internas existentes del equipo

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 16
¿Umbral minimo de similitud / confianza facial para considerar autenticado?

A) >= 90% (estricto)

B) >= 80% (equilibrado)

C) Configurable por variable/Secret (default 90)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: X me equivoque de servicio es AWS cognito

---

## Pregunta 17
¿Documentacion SAM del equipo (`documentation/Wiki.md`, `context.md`, `postman.json`)?

A) Crear/actualizar esas piezas en la carpeta del proyecto SAM cuando se implemente

B) Solo README minimo por ahora; documentacion formal despues

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A
