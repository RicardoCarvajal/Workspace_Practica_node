# Plan de generacion de User Stories

Responde cada pregunta escribiendo la letra despues de `[Answer]:`.
Cuando termines, escribe **listo** en el chat.

---

## Evaluacion (completada)
- User Stories: **SI** — app nueva orientada a usuarios funcionales (ver `user-stories-assessment.md`)

---

## Preguntas de planificacion

### Pregunta 1 — Personas
Cuantas personas de usuario debemos definir?

A) Una sola: Colaborador funcional (MVP)

B) Dos: Colaborador funcional + Facilitador/PO que revisa MRs

C) Tres: Colaborador funcional, Facilitador/PO, y Desarrollador (consumidor del MR)

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

### Pregunta 2 — Enfoque de desglose de historias
Como organizar las historias?

A) Por journey del usuario (login → listar repos → inception → diff → chat → MR)

B) Por feature (auth, repos, viewer, diff, Gemini, publish, packaging)

C) Por persona (historias agrupadas por tipo de usuario)

D) Hibrido: epics por journey y stories por feature dentro de cada epic

E) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

### Pregunta 3 — Granularidad
Que tamano de historia prefieres?

A) Historias pequenas (1 capacidad clara cada una; mas cantidad)

B) Historias medianas (agrupar pasos relacionados; menos cantidad)

C) Mixto: epics grandes + stories pequenas INVEST

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

### Pregunta 4 — Criterios de aceptacion
Que formato de acceptance criteria?

A) Checklist Given/When/Then (Gherkin ligero)

B) Lista de bullets verificables (si/no)

C) Ambos: bullets + escenario principal Given/When/Then por historia critica

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

### Pregunta 5 — Idioma de las historias
En que idioma generar `stories.md` y `personas.md`?

A) Espanol

B) Ingles

C) Espanol (historias) + titulos/IDs en ingles

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

### Pregunta 6 — Prioridad MVP
Que epics/stories son P0 (imprescindibles en la primera entrega)?

A) Auth + listar repos + ver inception + preview MD + cambios recientes + chat Gemini + MR (todo el flujo feliz)

B) Primero solo lectura (auth + repos + inception + preview + cambios recientes); chat/MR en P1

C) Auth + inception + chat/MR primero; diffs/preview en P1

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: B

---

### Pregunta 7 — Errores y casos borde a cubrir en historias
Que escenarios de error incluir en acceptance criteria?

A) Solo errores criticos (credenciales invalidas, sin inception, fallo API GitLab/Gemini, fallo al crear MR)

B) Criticos + recuperacion (reintento, sesion expirada, archivo en conflicto al commit)

C) Minimos; el detalle de errores se deja para NFR Design

D) Otro (describelo despues de [Answer]: abajo)

[Answer]: A

---

## Decisiones del plan (respuestas registradas)

| # | Decision |
|---|---|
| Personas | 1 — Colaborador funcional |
| Desglose | Por feature |
| Granularidad | Historias pequenas |
| AC | Bullets verificables |
| Idioma | Espanol |
| P0 MVP | Solo lectura (auth, repos, inception, preview, cambios recientes); chat/MR = P1 |
| Errores en AC | Solo criticos |
| **Rama** | **Solo rama `dev`** (lectura desde `dev`; MR hacia `dev`; sin selector de ramas) |

### Interpretacion de rama `dev` (para aprobacion)
1. Toda lectura usa `dev`.
2. Si no existe `dev` → error y no abrir el repo.
3. En P1: rama de trabajo desde `dev` + MR con target `dev`.

---

## Checklist de ejecucion (Part 2 — tras aprobar este plan)

- [x] Generar `aidlc-docs/inception/user-stories/personas.md` segun respuestas
- [x] Generar `aidlc-docs/inception/user-stories/stories.md` con historias INVEST + acceptance criteria
- [x] Incluir historia/AC de restriccion a rama `dev` (FR-10)
- [x] Mapear personas a historias
- [x] Verificar cobertura de requisitos FR-01 a FR-10 y NFR clave
- [x] Presentar historias para aprobacion del usuario

## Enfoques considerados (referencia)

| Enfoque | Beneficio | Costo |
|---|---|---|
| Journey | Claro para funcionales | Puede mezclar capas tecnicas |
| Feature | Facil de implementar | Menos narrativa de usuario |
| Persona | Bueno multi-rol | Solo 1 persona primaria en MVP |
| Hibrido epic+feature | Balance | Un poco mas de documentacion |
