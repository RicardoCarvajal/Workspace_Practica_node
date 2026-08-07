# Component Methods — ATE AI-DLC IDE

Nota: firmas de alto nivel. Reglas de negocio detalladas en Functional Design.

## AuthSession
| Method | Input | Output | Purpose |
|---|---|---|---|
| `login(baseUrl, username, password)` | strings | `{ ok }` / error | Autenticar sesion GitLab |
| `logout()` | — | void | Limpiar credenciales y drafts |
| `isAuthenticated()` | — | boolean | Estado de sesion |

## RepoCatalog
| Method | Input | Output | Purpose |
|---|---|---|---|
| `listRepositories` | — | `RepoSummary[]` | Listar repos accesibles |
| `search(query)` | string | `RepoSummary[]` | Filtrar por nombre |

## InceptionBrowser
| Method | Input | Output | Purpose |
|---|---|---|---|
| `openRepository(projectId)` | id | `{ tree }` / error | Abrir repo en rama `dev` + path inception |
| `getTree(path?)` | path opcional | `TreeNode[]` | Listar bajo inception |
| `getFile(path)` | path relativo | `{ content, isMarkdown }` | Leer archivo desde `dev` (o draft si existe) |

## RecentChanges
| Method | Input | Output | Purpose |
|---|---|---|---|
| `getRecentDiff(projectId, path)` | id, path | `{ diff, commitMeta }` / error | Ultimo cambio del archivo en `dev` |

## GeminiChat
| Method | Input | Output | Purpose |
|---|---|---|---|
| `sendMessage(projectId, message, contextPaths?)` | texto + paths | `{ reply, editedFiles? }` | Chat y posibles ediciones |
| `applyEdits(edits[])` | `{ path, content }[]` | void | Escribir borradores via DraftWorkspace |

## PublishPipeline
| Method | Input | Output | Purpose |
|---|---|---|---|
| `previewChanges(projectId)` | id | lista de paths borrador | Resumen antes de publicar |
| `confirmPublish(projectId, title, message)` | id, strings | `{ mrUrl }` / error | Commit + rama + MR → `dev` |

## DraftWorkspace
| Method | Input | Output | Purpose |
|---|---|---|---|
| `writeDraft(projectId, path, content)` | — | void | Guardar temp en disco |
| `readDraft(projectId, path)` | — | string \| null | Leer borrador |
| `listDrafts(projectId)` | — | paths[] | Paths modificados |
| `clearDrafts(projectId?)` | — | void | Limpiar al logout |

## AppShell
| Method | Input | Output | Purpose |
|---|---|---|---|
| `navigate(view)` | view id | void | Cambiar pantalla |
| `showError(error)` | AppError | void | Mostrar error amigable |
