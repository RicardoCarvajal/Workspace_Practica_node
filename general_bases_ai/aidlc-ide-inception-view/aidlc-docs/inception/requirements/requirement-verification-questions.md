# Preguntas de aclaracion de requisitos

Responde cada pregunta escribiendo la letra elegida despues de la etiqueta `[Answer]:`.
Si ninguna opcion coincide, elige **Otro** y describe tu preferencia despues de la etiqueta.

Cuando termines, responde en el chat que estas listo (por ejemplo: "done" o "listo").

---

## Pregunta 1
Que plataforma Git esta corriendo en `https://git.intelix.biz/`? (Esto define la API para listar repos y archivos.)

A) Gitea

B) GitLab (autoalojado / self-hosted)

C) Bitbucket Server / Data Center

D) No estoy seguro — primero soportar la opcion self-hosted mas comun (Gitea)

E) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Pregunta 2
Como debe autenticarse la aplicacion contra el servidor Git?

A) Usuario + contrasena (HTTP Basic), guardados en configuracion local

B) Usuario + Personal Access Token (PAT), guardados en configuracion local

C) Ambos: la contrasena o el token en el mismo campo de clave/token

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 3
Como debe obtener la app el contenido del repositorio y las diferencias entre archivos?

A) Solo via API REST del servidor Git (navegar arboles/blobs/commits remotos sin clon local)

B) Clonar/actualizar repositorios localmente con git y mostrar arbol y diffs desde la copia local

C) Hibrido: listar repos via API; clonar bajo demanda al abrir un repositorio para inspeccionar `aidlc-docs` y diffs

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 4
Que tipo de diferencias entre archivos debe poder ver el usuario?

A) Diff entre dos ramas (por ejemplo main vs feature)

B) Diff entre dos commits

C) Working-tree vs HEAD (cambios locales sin commit) — solo si se usa clon local

D) Comparar ramas Y comparar commits (ambos)

E) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: E diferencias entre archivos que elija

---

## Pregunta 5
Al abrir un repositorio, la app debe localizar `aidlc-docs` y mostrar solo ese contenido. Que hacer si `aidlc-docs` no existe?

A) Mostrar un estado vacio/error claro: "aidlc-docs no encontrado en este repositorio"

B) Mostrar el arbol completo del repositorio con una advertencia

C) Ofrecer un selector manual de ruta para elegir otra carpeta de documentacion

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 6
Que repositorios deben aparecer en la lista?

A) Todos los repositorios a los que el usuario autenticado tenga acceso

B) Repositorios de una organizacion/grupo concreto (el usuario configura el nombre)

C) Una lista permitida (allow-list) de nombres/URLs de repositorios en configuracion

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 7
En que idioma debe presentarse la interfaz de usuario?

A) Solo espanol

B) Solo ingles

C) Espanol por defecto, con ingles opcional mas adelante

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Pregunta 8
Donde deben almacenarse las credenciales (usuario / contrasena o token)?

A) Almacenamiento local cifrado (p. ej. keychain del SO / electron safeStorage)

B) Archivo de configuracion local en texto plano en el directorio de datos del usuario (mas simple; menos seguro)

C) Solo en sesion: pedir en cada inicio de la app; no persistir

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Pregunta 9
Que formatos de instalador/paquete debe generar el build?

A) Windows: NSIS (.exe) + Linux: AppImage

B) Windows: NSIS (.exe) + Linux: AppImage y .deb

C) Windows: .exe portable + Linux: AppImage

D) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Pregunta 10
Ademas de listar repos, navegar `aidlc-docs` y ver diffs, que se requiere en la primera version (MVP)?

A) Solo visor de solo lectura (listar + navegar aidlc-docs + diffs) — sin push/commit/PR

B) Solo lectura + abrir archivos seleccionados en el editor predeterminado del sistema

C) Solo lectura + vista previa Markdown de archivos `.md` dentro de aidlc-docs

D) Solo lectura + vista previa Markdown + abrir en editor del sistema

E) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Pregunta 11
Deben aplicarse las reglas de la extension de seguridad en este proyecto?

A) Si — aplicar todas las reglas de SECURITY como restricciones bloqueantes (recomendado para aplicaciones de produccion)

B) No — omitir todas las reglas de SECURITY (adecuado para PoCs, prototipos y proyectos experimentales)

X) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 12
Debe aplicarse la linea base de resiliencia en este proyecto?

**Que es esta extension.** Al activarla se aplican buenas practicas de diseno para sistemas resilientes (tolerancia a fallos, observabilidad, recuperacion). Es un punto de partida, no una certificacion de produccion.

A) Si — aplicar la linea base de resiliencia como guia de diseno y buenas practicas

B) No — omitir la linea base de resiliencia (adecuado para PoCs, prototipos y proyectos experimentales)

X) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 13
Deben aplicarse las reglas de property-based testing (PBT) en este proyecto?

A) Si — aplicar todas las reglas de PBT como restricciones bloqueantes

B) Parcial — aplicar PBT solo para funciones puras y round-trips de serializacion

C) No — omitir todas las reglas de PBT (adecuado para apps de escritorio centradas en UI o capas delgadas de integracion)

X) Otro (describelo despues de la etiqueta [Answer]: abajo)

[Answer]: A
