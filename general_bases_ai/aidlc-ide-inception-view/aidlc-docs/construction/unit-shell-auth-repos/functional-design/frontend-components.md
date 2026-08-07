# Frontend Components — unit-shell-auth-repos

Stack: React + CSS/Tailwind minimo. Estado de UI en Renderer; secretos en Main.

## Hierarchy
```
AppShell
  LoginPage
    LoginForm (baseUrl, username, password, submit)
  RepoListPage
    RepoSearchBar
    RepoList (items + load more)
    RepoListItem
  GlobalErrorBanner (opcional)
```

## LoginPage
- **State**: baseUrl, username, password, submitting, error
- **On mount**: pedir remembered hint via IPC; no password
- **Submit**: `aidlc:login` → on success navigate Lista
- **Validation UI**: campos requeridos; error generico del Main

## RepoListPage
- **State**: items, page, hasMore, searchQuery, loading, error, selectedId?
- **On mount**: primera pagina
- **SearchBar**: onChange debounce → server search page=1
- **Load more**: button si hasMore
- **Item click**: `aidlc:open-repo` → si OK, ruta/vista para unidad 2

## Props (alto nivel)
| Component | Key props |
|---|---|
| LoginForm | initialBaseUrl, initialUsername, onSubmit, error, submitting |
| RepoSearchBar | value, onChange, disabled |
| RepoList | items, hasMore, onLoadMore, onSelect, loading |
| RepoListItem | repo: RepoSummary, onClick |

## User flows
1. Login → Lista
2. Buscar → ver resultados paginados
3. Abrir repo → (unidad 2) o error sin `dev`
4. Logout → Login
