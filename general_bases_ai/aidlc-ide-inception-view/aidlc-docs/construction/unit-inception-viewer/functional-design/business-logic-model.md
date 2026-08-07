# Business Logic Model — unit-inception-viewer

## Scope decisions (FD answers)
- Lectura + edicion manual en textarea; borradores en sesion (temp); Gemini/MR fuera de scope
- Layout: arbol izquierda / contenido derecha
- `.md`: tabs Preview | Texto
- Cambios recientes: panel/modal con diff unificado
- Sin `aidlc-docs/inception/`: error en workspace, sin mostrar otras carpetas
- Binarios: no previsualizar
- Navegacion: pantalla Workspace aparte; "Volver a repositorios"

## Workflows

### WF-10 Enter workspace
1. Tras `open-repo` OK (unidad 1), AppShell navega a WorkspacePage con SelectedProjectContext.
2. Main carga arbol raiz bajo `aidlc-docs/inception/` en rama `dev` (`aidlc:list-tree`).
3. Si path ausente → AppError INCEPTION_MISSING; workspace sin arbol de otras rutas.
4. OK → mostrar TreeNode[]; ningun archivo seleccionado aun.

### WF-11 Navigate tree
1. Usuario expandir/colapsar carpeta → lazy load hijos si no cargados (`aidlc:list-tree` path hijo).
2. Solo paths bajo prefijo `aidlc-docs/inception/` (normalizar y rechazar `..` / escapes).
3. Click archivo → WF-12.

### WF-12 Open file
1. Si tipo no texto/binario → mensaje "Este tipo de archivo no se puede previsualizar"; no fetch blob como texto.
2. Si texto: `aidlc:get-file` (rama `dev`) → FileContent.
3. Si hay borrador en DraftWorkspace para ese path → preferir contenido del borrador (marcar dirty).
4. Panel derecho: tabs Preview | Texto (Preview activo solo si `.md`; si no `.md`, solo Texto o Preview deshabilitado).
5. Fail carga → AppError claro; mantener arbol.

### WF-13 Edit file (manual)
1. En tab Texto, usuario edita textarea.
2. Al cambiar contenido vs remoto/borrador guardado → estado dirty.
3. Accion Guardar borrador → DraftWorkspace escribe temp (no commit GitLab).
4. Accion Descartar borrador → elimina temp y recarga remoto `dev`.
5. No publicar a GitLab en esta unidad.

### WF-14 Recent changes
1. Requiere archivo seleccionado (path relativo inception).
2. Accion "Cambios recientes" → `aidlc:file-recent-diff` sobre `dev`.
3. Main: ultimo commit que toco el archivo + diff vs padre (o mensaje sin historial).
4. UI: modal/panel overlay con diff unificado legible; cerrar vuelve al contenido.
5. Fail → mensaje claro en el modal/banner.

### WF-15 Back to repos
1. "Volver a repositorios" → limpia seleccion de archivo en UI; mantiene sesion auth.
2. Borradores temp pueden permanecer hasta logout (o limpiar al salir del repo — preferir limpiar al salir del proyecto / logout).

## Data transformations
- GitLab tree/blob JSON → TreeNode / FileContent
- Draft temp file → overlay sobre FileContent
- Commit+diff GitLab → RecentDiffView (header + unified hunks)
- Path input → PathUnderInception (validado)

## Integration points
- GitLab REST: repository tree, files/raw, commits, compare/diff (rama `dev`)
- IPC: `aidlc:list-tree`, `aidlc:get-file`, `aidlc:save-draft`, `aidlc:discard-draft`, `aidlc:file-recent-diff`
- DraftFileStore (temp under userData)
