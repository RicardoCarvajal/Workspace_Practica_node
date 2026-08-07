# Business Rules — unit-inception-viewer

## BR-PATH-1 — Solo inception
- Toda lectura/escritura de contenido esta limitada a paths bajo `aidlc-docs/inception/`.
- Rechazar paths absolutos, `..`, o prefijos distintos → VALIDATION_ERROR.

## BR-PATH-2 — Falta inception
- Si `aidlc-docs/inception/` no existe en `dev` → error en workspace; no listar resto del repo.

## BR-BRANCH-1 — Solo `dev`
- Tree, file, draft base y recent diff siempre referencian rama `dev`.
- No hay selector de ramas.

## BR-FILE-1 — Tipos de archivo
- Extensiones/MIME tratadas como texto: tipicamente `.md`, `.txt`, `.json`, `.yml`, `.yaml`, `.xml`, `.csv`, sin extension corta conocida de texto.
- Binarios / imagenes / desconocidos peligrosos: no decode como texto; mensaje fijo ES.

## BR-MD-1 — Preview Markdown
- Solo archivos cuyo nombre termina en `.md` (case-insensitive) habilitan tab Preview.
- Preview es render basico (titulos, listas, enlaces, codigo inline/bloques); sin HTML crudo peligroso (sanitizar o no interpretar HTML raw).

## BR-EDIT-1 — Borradores
- Edicion manual solo afecta DraftWorkspace (temp); no muta GitLab hasta unidad publish.
- Un path tiene a lo sumo un borrador activo por proyecto.
- Dirty = contenido textarea distinto del ultimo guardado en borrador o del remoto si no hay borrador.

## BR-EDIT-2 — Limpieza
- Logout → limpiar todos los borradores.
- Salir del proyecto ("Volver a repositorios") → limpiar borradores de ese projectId (preferido para no mezclar repos).

## BR-DIFF-1 — Cambios recientes
- Diff del cambio mas reciente del archivo en `dev` (ultimo commit que modifico el path).
- Si un solo commit / sin padre / sin cambios → mensaje claro, no pantalla vacia.
- Presentacion: unified diff; sin requerir conocimiento git avanzado (etiquetas en espanol).

## BR-SEC-1 — Secretos
- No loguear contenido completo de archivos ni tokens.
- IPC no envia password; usa sesion Main existente.

## BR-ERR-1 — Errores usuario
- Mensajes en espanol, sin stack traces.
- Fallos de red/API → AppError reutilizable (network / not found / validation).
