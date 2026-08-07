# Plan de Application Design

Responde cada pregunta con la letra en `[Answer]:`. Cuando termines, escribe **listo** en el chat.

---

## Checklist de artefactos (tras aprobar respuestas)

- [x] Generar `components.md`
- [x] Generar `component-methods.md`
- [x] Generar `services.md`
- [x] Generar `component-dependency.md`
- [x] Generar `application-design.md` (consolidado)
- [x] Validar consistencia del diseno

---

## Pregunta 1 — Estilo de arquitectura Electron

A) Separacion clasica: Main process (Node) + Renderer (React) + preload bridge (contextIsolation)

B) Electron + React sin enfatizar preload (menos aislamiento)

C) Arquitectura multi-ventana (una ventana por repo)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 2 — Donde se hacen las llamadas a GitLab y Gemini

**Que significa esto (explicacion):**
Electron tiene dos partes:
- **Main**: proceso de Node (mas cercano al sistema; mejor para secretos).
- **Renderer**: la ventana con React (lo que el usuario ve).

La pregunta es: **desde cual parte la app llama a internet** (API de GitLab y API de Gemini), porque ahi viajan usuario/clave y la API key.

**Recomendacion de seguridad:** A o C (no poner la clave en React si se puede evitar).

A) Las llamadas salen del **Main**. React pide "lista repos" / "abre archivo" al Main por IPC; el Main llama a GitLab/Gemini.

B) Las llamadas salen del **Renderer** (React hace `fetch` directo). Mas simple, pero la clave puede quedar mas expuesta en el proceso de la UI.

C) Igual que A en la practica: **GitLab y Gemini solo en Main**; React solo UI. (Opcion explicita de "ambos clientes en Main".)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 3 — Limites de componentes de dominio

A) Componentes: AuthSession, RepoCatalog, InceptionBrowser, RecentChanges, GeminiChat, PublishPipeline, AppShell

B) Agrupar: SessionGateway (auth+repos), DocsWorkspace (browser+diff+preview), AiAssist (chat+edits), ReleasePublish (MR), AppShell

C) Seguir exactamente las 4 unidades del execution plan como unicos componentes de diseno

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 4 — Estado de ediciones en sesion (antes del MR)

A) Store en memoria en el Main (mapa path a contenido borrador)

B) Store en el Renderer (p. ej. Zustand) hasta publicar via IPC

C) Archivos temporales en disco del usuario

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: C

---

## Pregunta 5 — Patron de orquestacion de servicios

A) Services en Main: GitLabService, GeminiService, PublishService; UI invoca casos de uso via IPC

B) Un solo Facade AidlcIdeFacade que concentra todo

C) Use-cases explicitos por flujo (Login, List Repositories, OpenInception, ShowRecentChanges, ChatEdit, PublishMr)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 6 — UI toolkit en el Renderer

A) React + CSS simple / Tailwind minimo (sin NextUI/shadcn del ERP web)

B) React + shadcn/ui (alineado a estandares frontend del monorepo)

C) React + NextUI

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 7 — Como se nombran los mensajes IPC (Main ↔ React)

**Que significa esto (explicacion):**
Cuando React necesita algo del Main (login, listar repos, leer un archivo), le envia un mensaje por **IPC**. Ese mensaje tiene un **nombre** (como el nombre de un endpoint).

Ejemplo mental:
- React: "oye Main, haz `aidlc:list-repos`"
- Main: ejecuta la llamada a GitLab y responde

La pregunta es solo la **convencion de nombres**, para que el codigo no quede desordenado.

A) Prefijo unico `aidlc:` — ejemplo: `aidlc:login`, `aidlc:list-repos`, `aidlc:get-file`  
   (todo empieza igual; facil de buscar en el codigo)

B) Por dominio/feature — ejemplo: `session.login`, `docs.getFile`, `ai.chat`, `publish.createMr`  
   (agrupa por area funcional)

C) Sin convencion ahora; se define despues en Code Generation

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Restricciones fijas (ya decididas)

- Rama Git fija: `dev`
- Contenido: solo `aidlc-docs/inception/`
- Credenciales Git: solo sesion
- Gemini API key: entorno / `.env`
- P0 lectura; P1 chat + MR
