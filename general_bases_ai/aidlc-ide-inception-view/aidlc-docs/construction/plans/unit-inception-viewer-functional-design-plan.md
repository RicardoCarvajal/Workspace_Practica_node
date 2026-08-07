# Plan Functional Design — unit-inception-viewer

Unidad 2: arbol `aidlc-docs/inception/`, abrir archivos, preview Markdown, cambios recientes (rama `dev`).
Historias: US-05, US-06, US-07, US-08.

Responde cada `[Answer]:` y escribe **listo** cuando termines.

---

## Checklist (tras respuestas)

- [x] Generar `business-logic-model.md`
- [x] Generar `business-rules.md`
- [x] Generar `domain-entities.md`
- [x] Generar `frontend-components.md`

---

## Pregunta 1 — Alcance de edicion en esta unidad

A) Solo lectura (P0): ver arbol, contenido y preview; edicion manual/Gemini queda para unidad posterior

B) Lectura + edicion manual en textarea (guardar borrador en sesion); Gemini/MR sigue en unidad posterior

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Pregunta 2 — Layout del workspace

A) Panel izquierdo: arbol de carpetas; panel derecho: contenido / preview

B) Arbol arriba y contenido abajo (apilado)

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 3 — Vista de archivos Markdown (`.md`)

A) Solo preview renderizado (con opcion de ver texto crudo)

B) Solo texto crudo (sin preview en MVP)

C) Tabs: Preview | Texto

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: C

---

## Pregunta 4 — Accion "Cambios recientes"

A) Panel/modal encima del contenido con diff unificado legible

B) Reemplazar temporalmente el panel de contenido por el diff (boton Volver)

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 5 — Si falta `aidlc-docs/inception/` en el repo

A) Mensaje de error en el workspace y no mostrar arbol de otras carpetas

B) Volver automaticamente a la lista de repos con el error

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 6 — Archivos no texto (binarios, imagenes, etc.)

A) Mostrar mensaje: "Este tipo de archivo no se puede previsualizar" (sin intentar abrir como texto)

B) Intentar mostrar como texto siempre

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 7 — Navegacion desde lista de repos

A) Al abrir repo con `dev`, ir a pantalla workspace (arbol inception); boton "Volver a repositorios"

B) Mostrar el workspace embebido debajo de la lista (misma pantalla)

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---
