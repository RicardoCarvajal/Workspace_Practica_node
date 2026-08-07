# Domain Entities — unit-inception-viewer

## TreeNode
| Field | Type | Notes |
|---|---|---|
| name | string | Nombre de entrada |
| path | string | Path relativo repo, bajo `aidlc-docs/inception/` |
| type | `'tree' \| 'blob'` | Carpeta o archivo |
| children | TreeNode[]? | Lazy; undefined = no cargados |
| expanded | boolean? | Solo UI |

## FileContent
| Field | Type | Notes |
|---|---|---|
| path | string | Bajo inception |
| branch | `'dev'` | Fijo |
| content | string | Texto UTF-8 |
| encoding | `'text'` | |
| isMarkdown | boolean | derived from path |
| fromDraft | boolean | true si viene de borrador |
| sha | string? | blob sha remoto (si aplica) |

## FileDraft
| Field | Type | Notes |
|---|---|---|
| projectId | number | |
| path | string | |
| content | string | |
| updatedAt | string | ISO |

## RecentDiffView
| Field | Type | Notes |
|---|---|---|
| path | string | |
| commitId | string | short/full |
| commitTitle | string | |
| authorName | string? | |
| committedAt | string? | ISO |
| unifiedDiff | string | texto diff |

## WorkspaceContext (extends SelectedProjectContext)
| Field | Type | Notes |
|---|---|---|
| projectId | number | |
| pathWithNamespace | string | |
| branch | `'dev'` | |
| selectedPath | string? | archivo abierto |
| inceptionAvailable | boolean | |

## AppError (reuse)
- codes nuevos tipicos: `inception_missing`, `file_not_previewable`, `draft_error`, `diff_unavailable`
