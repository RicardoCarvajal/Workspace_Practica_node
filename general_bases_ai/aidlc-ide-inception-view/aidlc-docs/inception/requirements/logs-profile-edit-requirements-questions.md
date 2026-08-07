# Preguntas de aclaracion — Logs + Editar nombre de perfil

Responde cada pregunta rellenando la etiqueta `[Answer]:` (letra de la opcion, o X con una descripcion breve).

---

## Pregunta 1
¿Donde debe vivir la carpeta `logs/`?

A) Siempre en la raiz del proyecto: `aidlc-ide-inception-view/logs/` (como pediste; ideal para `npm run dev`; puede fallar o ser de solo lectura en AppImage/portable empaquetado)

B) Siempre bajo el userData de Electron (carpeta de datos de la app)/`logs/` — funciona en builds empaquetados; no queda dentro de la carpeta del repo git

C) Preferir la raiz del proyecto `logs/` cuando la app pueda escribir ahi (dev / ejecutando desde el repo); si no, usar userData/`logs/`

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 2
¿Que debe ocurrir cuando el archivo de log llega a ~400 KB?

A) Vaciar / truncar el archivo actual y empezar a escribir desde cero (limpiar simple)

B) Rotar: renombrar el actual a `app.log.1` (o con marca de tiempo), crear un `app.log` nuevo vacio, y borrar rotaciones viejas para que el tamano total se mantenga cerca de 400 KB

C) Conservar solo las ultimas ~400 KB de contenido (recortar desde el principio, mantener las lineas mas recientes)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 3
¿Que se debe escribir en el archivo de log?

A) Solo errores y advertencias (proceso main + errores de IPC / servicios fallidos)

B) Info + advertencias + errores (arranque, resultado de login, abrir repo, indexacion, pull, eventos de alto nivel de chat/RAG, errores)

C) Reflejar todo lo que iria a la consola (log / info / warn / error) del proceso main

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Pregunta 4
¿Como debe abrir el usuario el flujo de “cambiar nombre”?

A) Clic en el nombre mostrado en la barra superior (topbar) para abrir el formulario de edicion

B) Un control visible en la topbar (por ejemplo boton o enlace “Cambiar nombre”) junto al nombre

C) Ambos: nombre clicable y un control explicito “Cambiar nombre”

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Pregunta 5
Si el nombre nuevo cambia el slug del archivo de observaciones (`observaciones-{slug}.md`), ¿que debe pasar con el archivo existente?

A) Renombrar el archivo local de observaciones al nuevo slug (y usar el nombre nuevo en commits futuros)

B) Dejar el archivo viejo como esta; crear/usar un archivo nuevo vacio para el nuevo slug

C) Copiar el contenido del archivo viejo al archivo con el nuevo slug; dejar el archivo viejo en su sitio (sin borrarlo)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Pregunta 6
Al renombrar el perfil, ¿tambien se debe renombrar el archivo de observaciones en GitLab (`dev`) en la misma accion, o solo en local hasta el siguiente push/cierre?

A) Solo actualizar el perfil local (+ renombrar/copiar archivo local segun Pregunta 5); GitLab se actualiza en el siguiente push/cierre normal de observaciones

B) Tras guardar el nombre nuevo, tambien hacer push/rename en GitLab `dev` en el mismo flujo (si hay proyecto abierto / credenciales disponibles)

X) Other (describe despues de la etiqueta [Answer]: abajo)

[Answer]: A
