# Business Rules — unit-shell-auth-repos

## BR-01 Login
- Usuario y contrasena obligatorios para autenticar.
- Password solo en memoria; no logs ni disco.
- Username y baseUrl pueden persistirse como RememberedLoginHint (Q1=B).
- Al abrir la app: mostrar Login; prefijar username/baseUrl si existen; pedir password siempre.
- Error de login: mensaje generico ES (Q3=A): "No se pudo iniciar sesion. Revisa usuario, clave o conexion."

## BR-02 Logout
- Limpia password e isAuthenticated.
- Opcional: conservar RememberedLoginHint (username/baseUrl).
- Vuelve a pantalla Login.
- Limpia lista de repos y SelectedProjectContext en memoria.

## BR-03 Listado y busqueda
- Listar repos via GitLab API con sesion autenticada.
- Paginacion / "cargar mas" (Q4=B).
- Busqueda en servidor GitLab (Q6=B), no solo filtro local.
- Al cambiar searchQuery, reiniciar paginacion a pagina 1.

## BR-04 Rama `dev`
- Al seleccionar/abrir un repo, verificar que existe la rama `dev` (Q2=A).
- Si no existe: error claro; no navegar al workspace (unidad 2).
- No hay selector de ramas; branch siempre `dev`.
- No es obligatorio marcar en el listado (solo validar al abrir).

## BR-05 Navegacion UI
- Dos pantallas: Login y Lista de repositorios (Q5=A).
- Tras login exitoso → Lista.
- Al abrir repo con `dev` OK → emitir contexto para unidad 2 (Inception viewer).

## BR-06 Seguridad
- IPC: Renderer no recibe password en logs; Main guarda Session.
- HTTPS hacia GitLab.
- Validar baseUrl (formato URL https).

## Testable Properties (PBT-01)
| Property | Category | Description |
|---|---|---|
| P-AUTH-1 | Invariant | Session.isAuthenticated == true solo si password en memoria no vacio tras login ok |
| P-AUTH-2 | Invariant | RememberedLoginHint nunca contiene password |
| P-REPO-1 | Invariant | SelectedProjectContext.branch siempre es `dev` |
| P-REPO-2 | Oracle | hasMore == false implica que no hay pagina siguiente solicitada |
| P-SEARCH-1 | Idempotence | Misma searchQuery + page produce mismos ids de items (dado mismo dataset mock) |
