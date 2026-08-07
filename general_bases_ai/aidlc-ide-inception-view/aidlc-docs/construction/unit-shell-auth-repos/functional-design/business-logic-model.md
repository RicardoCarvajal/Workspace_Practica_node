# Business Logic Model — unit-shell-auth-repos

## Workflows

### WF-01 Start app / Login
1. Cargar RememberedLoginHint (si existe).
2. Mostrar Login con baseUrl/username prefijados; password vacio.
3. Usuario envia login → Main AuthSession.login via `aidlc:login`.
4. GitLabService valida credenciales (p. ej. GET /api/v4/user).
5. OK → isAuthenticated=true; guardar hint (username, baseUrl); navegar a Lista.
6. Fail → AppError generico; permanecer en Login.

### WF-02 List / Search / Paginate
1. Al entrar a Lista: `aidlc:list-repos` page=1, query vacia o ultima query.
2. Usuario escribe busqueda → debounce → reinicia page=1 → busqueda servidor.
3. "Cargar mas" → page+1 → concatena items (o reemplaza segun UX; preferir append).
4. Mostrar loading / error generico de red si falla.

### WF-03 Open repository
1. Usuario elige RepoSummary.
2. `aidlc:open-repo` con projectId.
3. Main verifica rama `dev` via GitLabService.
4. OK → SelectedProjectContext; handoff a unidad 2.
5. Fail → error "La rama dev no existe en este repositorio" (o equivalente ES); quedarse en Lista.

### WF-04 Logout
1. `aidlc:logout` → limpia Session password/auth y caches de lista.
2. Navega a Login (hint username permanece).

## Data transformations
- GitLab project JSON → RepoSummary (id, name, path_with_namespace, description)
- HTTP errors → AppError (sin filtrar password; mensaje generico en login)

## Integration points
- GitLab REST: user, projects (list/search/pagination), repository branches
- IPC: `aidlc:login`, `aidlc:logout`, `aidlc:list-repos`, `aidlc:open-repo`, `aidlc:get-remembered-login`
