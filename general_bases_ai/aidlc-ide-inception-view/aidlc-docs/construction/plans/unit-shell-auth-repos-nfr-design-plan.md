# Plan NFR Design — unit-shell-auth-repos

Responde cada `[Answer]:` y escribe **listo**.

Contexto ya decidido: timeout 30s, latency hasta 5s, fetch en Main, logs basicos, unit tests.

---

## Checklist (tras respuestas)

- [x] Generar `nfr-design-patterns.md`
- [x] Generar `logical-components.md`

---

## Pregunta 1 — Reintentos ante fallo de red (listado/busqueda)

A) Sin reintento automatico; el usuario pulsa de nuevo / "cargar mas"

B) Un reintento automatico silencioso solo en GET (list/search), luego error en UI

C) Hasta 3 reintentos con espera corta en GET

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 2 — Cache de lista de repos en memoria

A) Sin cache: cada entrada a la pantalla o busqueda consulta GitLab

B) Cache en memoria de la pagina actual hasta logout o busqueda nueva

C) Cache con TTL (p. ej. 60s) para no repetir la misma pagina

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 3 — Patron de seguridad para password en Main

A) Variable de sesion en memoria + borrar en logout; nunca serializar

B) Igual que A + limpiar tambien al cerrar la ventana (before-quit)

C) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 4 — Cancelacion de peticiones lentas

A) AbortController: al cambiar busqueda o desmontar, cancelar fetch en curso

B) No cancelar; ignorar respuestas viejas por un contador de secuencia

C) Ninguno (dejar que terminen)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 5 — Componentes logicos extra (ademas de Auth/GitLab/UI)

A) Solo lo esencial: SessionStore, GitLabApiClient, IpcFacade, RememberedLoginStore

B) Anadir RateLimitGuard (evitar spam de busquedas)

C) Anadir CircuitBreaker hacia GitLab (abrir tras N fallos)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A
