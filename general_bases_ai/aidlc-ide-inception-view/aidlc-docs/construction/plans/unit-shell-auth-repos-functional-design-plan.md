# Plan Functional Design — unit-shell-auth-repos

Unidad 1: shell Electron, login, lista de repos, rama `dev`.
Historias: US-01, US-02, US-03, US-04.

Responde cada `[Answer]:` y escribe **listo** cuando termines.

---

## Checklist (tras respuestas)

- [x] Generar `business-logic-model.md`
- [x] Generar `business-rules.md`
- [x] Generar `domain-entities.md`
- [x] Generar `frontend-components.md`

---

## Pregunta 1 — Que pasa si el usuario ya tiene sesion al abrir la app?

A) Siempre pedir login (credenciales no se guardan; pantalla de login al inicio)

B) Recordar solo el usuario (no la clave) y pedir solo la clave

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Pregunta 2 — Como se valida que existe la rama `dev`?

A) Al abrir un repo: si no hay `dev`, error y no se entra al workspace

B) En el listado: marcar repos sin `dev` como no disponibles / deshabilitados

C) Ambas: marcar en lista y bloquear al abrir

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 3 — Errores de login (credenciales invalidas / red)

A) Mensaje generico en espanol: "No se pudo iniciar sesion. Revisa usuario, clave o conexion."

B) Distinguir: credenciales invalidas vs error de red vs servidor no disponible

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 4 — Paginacion del listado de repos

A) Cargar todos los accesibles de una vez (o hasta un limite razonable de la API)

B) Paginacion / "cargar mas" en la UI

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Pregunta 5 — Pantallas de esta unidad (UI)

A) Dos pantallas: Login y Lista de repositorios (al elegir uno, deja listo el contexto para la unidad 2)

B) Una sola pantalla con login embebido arriba y lista abajo

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 6 — Busqueda de repos

A) Filtro local por nombre sobre la lista ya cargada

B) Busqueda en el servidor GitLab (API search)

C) Ambos: filtro local primero; opcional buscar en servidor

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

## Pregunta 7 — Modelo de "sesion" (entidades)

A) Session = { baseUrl, username, passwordEnMemoria, isAuthenticated }; RepoSummary = { id, name, pathWithNamespace, description? }

B) Incluir tambien token/headers derivados y cache de ultima lista de repos en memoria

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A
