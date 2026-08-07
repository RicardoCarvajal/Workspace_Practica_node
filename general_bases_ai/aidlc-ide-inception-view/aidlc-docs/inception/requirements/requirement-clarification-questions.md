# Preguntas de aclaracion — contradicciones y alcance adicional

Se detectaron contradicciones y requisitos nuevos. Resuelve estas aclaraciones antes de generar el documento de requisitos.

**Respuestas ya registradas (resumen):**
- GitLab self-hosted + usuario/contrasena (sesion, sin persistir)
- Contenido solo via API REST
- Diff: archivos que el usuario elija
- Sin `aidlc-docs` → error claro
- Todos los repos accesibles; UI espanol por defecto
- Instaladores: Windows NSIS + Linux AppImage y .deb
- MVP previo: solo lectura + preview Markdown
- Extensiones: Security, Resiliency y PBT activas

---

## Contradiccion 1: Solo lectura vs. modificar y subir a Git

En la Pregunta 10 respondiste **C** (visor de solo lectura + vista previa Markdown).  
En el chat indicaste un **chat con Gemini** que ayude a **modificar archivos** y **subirlos al Git**.

### Pregunta A1
Cual es el alcance real de escritura en la primera version?

A) Solo lectura + chat Gemini que sugiere cambios (el usuario copia/pega manualmente; la app NO escribe ni hace push)

B) Chat Gemini puede proponer y aplicar cambios en archivos de inception, y el usuario confirma un commit/push a GitLab

C) Chat Gemini puede aplicar cambios automaticamente y hacer commit/push sin confirmacion extra

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Ambiguidad 1: Alcance de visualizacion (solo Inception)

Indicaste que la app es solo para visualizar archivos de la **fase de inception**, para colaboradores funcionales.

### Pregunta A2
Que contenido exactamente se muestra al abrir un repositorio?

A) Solo la carpeta `aidlc-docs/inception/` (y su contenido)

B) Toda la carpeta `aidlc-docs/`, pero con enfasis/navegacion inicial en inception

C) Solo archivos tipicos de inception (requirements, user-stories, application-design, plans), aunque esten en otras rutas

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Ambiguidad 2: Diff entre "archivos que elija"

En la Pregunta 4 respondiste **E** con: "diferencias entre archivos que elija".

### Pregunta A3
Que significa comparar archivos que el usuario elija?

A) El usuario elige dos archivos cualesquiera y ve el diff entre ellos

B) El usuario elige un archivo y dos referencias (rama o commit) y ve el diff de ese archivo entre esas referencias

C) El usuario elige varios archivos y ve el diff de cada uno entre la rama base y la rama seleccionada

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: D Lo que debe suceder es que el usuario elige el un archivo y debe tener un boton que le muestre que fuen lo que se cambio mas recientemente

---

## Ambiguidad 3: Chat con Gemini y subida a Git

### Pregunta A4
Donde se configura y guarda la API key de Gemini?

A) En la misma pantalla de configuracion que usuario/clave de Git, cifrada en el SO (safeStorage/keychain)

B) En la misma pantalla, pero solo en sesion (no se guarda al cerrar la app)

C) Variable de entorno / archivo .env local (no en la UI)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: C

---

### Pregunta A5
Que puede hacer el chat de Gemini sobre los archivos de inception?

A) Solo responder preguntas y explicar el contenido (sin proponer ediciones estructuradas)

B) Proponer ediciones (diff/patch) que el usuario revisa y acepta o rechaza antes de aplicar

C) Editar archivos directamente en la app al pedir cambios, y luego el usuario decide si hace commit/push

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: C

---

### Pregunta A6
Como se suben los cambios al Git (GitLab)?

A) La app crea un commit en una rama nueva y hace push; el usuario abre/mergea el MR en GitLab por su cuenta

B) La app crea commit + push + Merge Request en GitLab automaticamente (tras confirmacion del usuario)

C) La app solo genera el diff/patch; el usuario aplica y sube los cambios fuera de la app

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

### Pregunta A7
Quien es el usuario principal de esta app?

A) Colaboradores funcionales (negocio/producto): ven inception, chatean con Gemini y aprueban cambios sugeridos

B) Desarrolladores tecnicos: mismos flujos pero con mas detalle tecnico (branches, commits, etc.)

C) Ambos perfiles, con la misma UI simplificada orientada a funcionales

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A
