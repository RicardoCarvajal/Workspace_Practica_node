# Plan NFR Requirements — unit-shell-auth-repos

Responde cada `[Answer]:` y escribe **listo**.

---

## Checklist (tras respuestas)

- [x] Generar `nfr-requirements.md`
- [x] Generar `tech-stack-decisions.md`

---

## Pregunta 1 — Tiempo de respuesta esperado (login y listado)

A) Relajado: hasta 5 segundos esta bien en red corporativa

B) Objetivo: la mayoria de llamadas < 2 segundos

C) Estricto: < 1 segundo (puede ser dificil con GitLab remoto)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 2 — Usuarios concurrentes de esta app (escritorio)

A) Pocos (1–10 personas; herramienta interna)

B) Equipo mediano (10–50)

C) Amplio (50+)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 3 — Runtime / lenguaje del Main y Renderer

A) Electron + React + TypeScript (recomendado para tipado)

B) Electron + React + JavaScript

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 4 — Cliente HTTP hacia GitLab

A) `fetch` nativo en Main

B) Libreria `axios` en Main

C) Cliente oficial / wrapper GitLab si existe y es simple

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 5 — Logging en esta unidad

A) Logs basicos en consola/Main (sin passwords), suficiente para MVP

B) Logs a archivo en userData + niveles info/warn/error

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 6 — Timeout de llamadas a GitLab

A) 15 segundos

B) 30 segundos

C) 60 segundos

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Pregunta 7 — Pruebas para esta unidad

A) Unit tests de logica (auth state, mapeo RepoSummary, reglas `dev`) + mocks de GitLab

B) Solo pruebas manuales en MVP

C) Unit + PBT de propiedades P-AUTH/P-REPO documentadas

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A
