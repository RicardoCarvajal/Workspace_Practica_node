# Clarificacion — Menu de modo + Chat Nova / LanceDB

Responde cada pregunta eligiendo una letra (o X) y rellenando `[Answer]:`.

Cuando termines, escribe en el chat que ya respondiste (o pega las respuestas).

---

## Question 1
Al hacer clic en un repositorio, ¿como debe mostrarse el menu de las dos opciones?

A) Pantalla intermedia a pantalla completa (dos tarjetas grandes: Observaciones / Chat)

B) Modal/dialogo sobre la lista de repos, y al elegir se abre el workspace en ese modo

C) Se abre el workspace siempre, y un selector en la barra superior cambia entre Observaciones y Chat

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
¿Que puede hacer el chat con Nova?

A) Solo analisis / preguntas (RAG): lee inception indexado; no modifica archivos de inception

B) Analisis + puede proponer/editar borradores locales de inception (como el chat antiguo), ademas del RAG

C) Solo analisis, pero puede citar y abrir el archivo en el visor (sin editar)

X) Other (please describe after [Answer]: tag below)

[Answer]: X Solo analisis, preguntas  y citar

---

## Question 3
Modelo de chat Amazon Nova (region us-east-1, salvo que indiques otra)

A) `amazon.nova-lite-v1:0` (rapido / economico; el usado antes en este proyecto)

B) `amazon.nova-pro-v1:0` (mayor calidad)

C) Configurable por `.env` (`BEDROCK_MODEL_ID`) con default nova-lite

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 4
Modelo de embeddings de Amazon Bedrock para LanceDB

A) `amazon.titan-embed-text-v2:0` (recomendado actual)

B) `amazon.titan-embed-text-v1`

C) Configurable por `.env` (`BEDROCK_EMBEDDING_MODEL_ID`) con default Titan Embed Text v2

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 5
¿Que significa «refrescar la BD vectorial cada vez que hago pull»?

A) El boton **Actualizar (pull)** del panel de observaciones tambien reindexa inception → LanceDB

B) Un boton dedicado **Actualizar documentos / indice** en el modo Chat (pull de archivos inception desde `dev` + reindex LanceDB)

C) Ambos: pull de observaciones y pull/reindex de documentos desde el modo Chat

X) Other (please describe after [Answer]: tag below)

[Answer]:A

---

## Question 6
Alcance del indice LanceDB (que se embeddea)

A) Solo archivos Markdown bajo `aidlc-docs/inception/` (excluyendo `observaciones/` o incluyendo todo inception)

B) Todo `aidlc-docs/inception/` incluyendo `observaciones/`

C) Solo la carpeta del documento abierto + hermanos cercanos

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 7
«Convertir respuesta en observacion» debe:

A) Agregar el texto de esa respuesta como nueva entrada en el archivo de observaciones del usuario (borrador local), sin push automatico

B) Igual que A, y ademas abrir el panel/modo Observaciones para revisar

C) Igual que A, y ofrecer de inmediato «Cerrar documento (push a dev)»

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
Estadistica de tokens: ¿que debe mostrarse?

A) Por ultimo mensaje (input / output / total) + acumulado de la sesion del repo mientras la app este abierta

B) Solo acumulado de la sesion

C) Por mensaje en cada burbuja + total de sesion en un pie fijo del chat

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
Credenciales AWS para Bedrock (chat + embeddings)

A) Solo desde `.env` / variables de entorno (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, opcional session token); no pedir en UI

B) Igual que A en local, y al `npm run dist` preguntar e incrustar (como GitLab)

C) Pedir en UI la primera vez y guardar en userData (ademas de .env)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
LanceDB es una carpeta en tu disco (dentro de los datos de la app Electron) donde se guardan los embeddings de los documentos. ¿Como la organizamos?

A) **Una carpeta por repositorio**: si abres el repo A y luego el repo B, cada uno tiene su propio indice. Asi el chat del repo A no mezcla documentos del repo B. (Recomendado)

B) **Una sola carpeta para todos los repos**: todos los documentos de todos los proyectos van al mismo indice (puede mezclar contexto entre proyectos)

C) **Por persona + repositorio**: se separa tambien por tu perfil (nombre/apellido) y por proyecto (util si varias personas usan el mismo PC con distintos perfiles)

X) Other (please describe after [Answer]: tag below)

[Answer]:A
