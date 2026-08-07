# Frontend Components — unit-inception-viewer

Stack: React + CSS minimo. Secretos y HTTP en Main. Drafts via IPC.

## Hierarchy
```
AppShell
  LoginPage (unidad 1)
  RepoListPage (unidad 1)
  WorkspacePage (nueva)
    WorkspaceToolbar (repo name, Volver, Cambios recientes, Guardar/Descartar borrador)
    WorkspaceLayout
      InceptionTreePanel
        TreeNodeItem (recursive)
      FilePane
        FileTabs (Preview | Texto) — Preview solo si .md
        MarkdownPreview
        TextEditor (textarea; editable)
    RecentChangesModal (overlay)
    ErrorBanner
```

## WorkspacePage
- **Props**: context: SelectedProjectContext; onBack: () => void
- **State**: tree, selectedPath, file, draftDirty, viewTab (`preview`|`text`), loading, error, diffModal
- **On mount**: `aidlc:list-tree` root inception
- **Back**: onBack → lista repos; Main limpia drafts del project

## InceptionTreePanel
- Expand/collapse; click blob → load file
- Highlight selectedPath
- Empty/error states

## FilePane
- Sin seleccion: mensaje "Selecciona un archivo"
- No previewable: mensaje BR-FILE-1
- Tabs: Preview | Texto (Q3=C)
- TextEditor: onChange marca dirty; Guardar/Descartar en toolbar

## MarkdownPreview
- Input: markdown string
- Output: HTML sanitizado basico / libreria ligera
- Solo cuando tab Preview y isMarkdown

## RecentChangesModal
- Open via toolbar cuando hay selectedPath
- Loading / error / unified diff
- Close → vuelve a FilePane

## User flows
1. Abrir repo → Workspace
2. Expandir arbol → abrir `.md` → Preview | editar Texto → Guardar borrador
3. Cambios recientes → modal diff → cerrar
4. Volver a repositorios

## IPC (Renderer)
| Action | Channel |
|---|---|
| List tree | `aidlc:list-tree` |
| Get file | `aidlc:get-file` |
| Save draft | `aidlc:save-draft` |
| Discard draft | `aidlc:discard-draft` |
| Recent diff | `aidlc:file-recent-diff` |
