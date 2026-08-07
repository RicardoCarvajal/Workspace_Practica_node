# Domain Entities — unit-shell-auth-repos

## Session
| Field | Type | Notes |
|---|---|---|
| baseUrl | string | Default `https://git.intelix.biz/` |
| username | string | Puede recordarse en disco (no secreto) |
| password | string | Solo memoria de sesion; nunca disco |
| isAuthenticated | boolean | true tras login exitoso |

## RememberedLoginHint (persistencia ligera)
| Field | Type | Notes |
|---|---|---|
| baseUrl | string | Ultima URL usada |
| username | string | Ultimo usuario (Q1=B) |

No incluye password.

## RepoSummary
| Field | Type | Notes |
|---|---|---|
| id | string/number | GitLab project id |
| name | string | Nombre corto |
| pathWithNamespace | string | path completo |
| description | string? | Opcional |

## RepoListPage
| Field | Type | Notes |
|---|---|---|
| items | RepoSummary[] | Pagina actual |
| page | number | Pagina 1-based |
| pageSize | number | Tamano de pagina |
| hasMore | boolean | Hay mas resultados |
| searchQuery | string | Busqueda servidor (Q6=B) |

## SelectedProjectContext
| Field | Type | Notes |
|---|---|---|
| projectId | id | Repo elegido |
| pathWithNamespace | string | Para mostrar |
| branch | literal `dev` | Fija; validada al abrir |

## AppError (UI)
| Field | Type | Notes |
|---|---|---|
| title | string | Corto ES |
| message | string | Amigable ES |
| code | string | Interno (login_failed, branch_missing, ...) |

## Relationships
```
RememberedLoginHint --> prefill --> Session (sin password)
Session --authenticates--> RepoListPage
RepoListPage --select--> SelectedProjectContext (requires branch `dev`)
```
