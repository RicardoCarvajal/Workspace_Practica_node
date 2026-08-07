# Plan de Units Generation (unidades de trabajo)

Responde cada pregunta con la letra en `[Answer]:`. Cuando termines, escribe **listo**.

**Que es una unidad?** Un bloque de trabajo para construir por partes (no son microservicios separados: es una sola app Electron).

---

## Checklist de artefactos (tras aprobar este plan)

- [x] Generar `aidlc-docs/inception/application-design/unit-of-work.md`
- [x] Generar `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- [x] Generar `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
- [x] Documentar organizacion de codigo (greenfield) en `unit-of-work.md`
- [x] Validar limites y que todas las historias US-01..US-12 esten asignadas

---

## Pregunta 1 — Cuantas unidades

Propuesta del execution plan (4 unidades):
1. `unit-shell-auth-repos` — Electron shell, login, lista de repos, rama `dev`
2. `unit-inception-viewer` — Arbol inception, preview Markdown, cambios recientes (P0)
3. `unit-gemini-publish` — Chat Gemini, borradores, commit/MR (P1)
4. `unit-packaging` — Instaladores NSIS/AppImage/deb + CI propuesto

A) Usar esas 4 unidades

B) Fusionar en 2: core-lectura (1+2) y escritura-empaque (3+4)

C) Una sola unidad monolitica (toda la app de una vez)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 2 — Como agrupar historias en unidades

A) Por feature / capacidad (como estan las user stories)

B) Por journey del usuario (login → ver → editar → publicar)

C) Por prioridad P0 luego P1 (primero todo lectura, despues escritura)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 3 — Orden de construccion

A) Secuencial: unit-shell-auth-repos → unit-inception-viewer → unit-gemini-publish → unit-packaging

B) unit-shell-auth-repos+unit-inception-viewer primero (P0 usable), luego unit-gemini-publish, unit-packaging en paralelo al final

C) Empezar por unit-packaging packaging (no recomendado)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 4 — Codigo compartido entre unidades

A) Carpeta `shared/` en el monorepo Electron (tipos, errores, IPC constants)

B) Duplicar lo minimo en cada unidad (evitar shared al inicio)

C) Un package npm interno `@aidlc/ide-shared`

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 5 — Estructura de carpetas del proyecto (greenfield)

A) Estructura Electron tipica:
```
/
  package.json
  electron/          (Main + preload)
  src/               (React renderer)
  shared/
  build/             (electron-builder config)
```

B) Por unidad de trabajo como carpetas top-level (`units/unit-shell-auth-repos/`, etc.)

C) `apps/desktop/` + `packages/shared/` (monorepo tools)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Pregunta 6 — Quien "posee" cada unidad (equipo)

A) Un solo desarrollador/equipo pequeno construye todas en orden

B) Dos frentes: alguien en P0 (1+2) y alguien en P1/packaging (3+4)

C) No aplica (solo yo / un agente AI construye todo)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Unidades propuestas vs historias (borrador)

| Unidad | Historias |
|---|---|
| unit-shell-auth-repos | US-01, US-02, US-03, US-04 |
| unit-inception-viewer | US-05, US-06, US-07, US-08 |
| unit-gemini-publish | US-09, US-10, US-11 |
| unit-packaging | US-12 |

---

## Decisiones registradas (para aprobacion)

| # | Decision |
|---|---|
| Unidades | 4: shell-auth-repos, inception-viewer, gemini-publish, packaging |
| Agrupacion | Por feature |
| Orden | Secuencial: 1 → 2 → 3 → 4 |
| Shared | Carpeta `shared/` |
| Carpetas | Electron tipica: `electron/`, `src/`, `shared/`, `build/` |
| Ownership | Un solo desarrollador/equipo (o agente) en orden |

**Unit of work plan complete.** Review this file. Ready to proceed to generation?

Responde **apruebo** / **continua** para generar `unit-of-work.md`, `unit-of-work-dependency.md` y `unit-of-work-story-map.md`.

