import { useCallback, useEffect, useRef, useState } from 'react'
import { isRequestCancelled } from '../../shared/errors'
import type { AppError, RepoSummary, SelectedProjectContext } from '../../shared/types'

interface Props {
  onLogout: () => void
  onOpened: (ctx: SelectedProjectContext) => void
  selected: SelectedProjectContext | null
  credentialsLocked?: boolean
  devMode?: boolean
  testRepoPath?: string | null
}

export default function RepoListPage({
  onLogout,
  onOpened,
  selected,
  credentialsLocked = false,
  devMode = false,
  testRepoPath = null
}: Props): JSX.Element {
  const [items, setItems] = useState<RepoSummary[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [openingId, setOpeningId] = useState<number | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchBootstrapped = useRef(false)

  const load = useCallback(async (nextPage: number, searchQuery: string, append: boolean) => {
    setLoading(true)
    const result = await window.aidlcApi.listRepos({
      page: nextPage,
      pageSize: 20,
      search: searchQuery
    })
    setLoading(false)
    if (!result.ok) {
      if (isRequestCancelled(result.error)) return
      setError(result.error)
      return
    }
    setError(null)
    setPage(result.data.page)
    setHasMore(result.data.hasMore)
    setItems((prev) => (append ? [...prev, ...result.data.items] : result.data.items))
  }, [])

  useEffect(() => {
    void load(1, '', false)
  }, [load])

  useEffect(() => {
    if (!searchBootstrapped.current) {
      searchBootstrapped.current = true
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setQuery(search)
      void load(1, search, false)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, load])

  async function handleLogout(): Promise<void> {
    await window.aidlcApi.logout()
    onLogout()
  }

  async function handleOpen(repo: RepoSummary): Promise<void> {
    setOpeningId(repo.id)
    setError(null)
    try {
      const result = await window.aidlcApi.openRepo({
        projectId: repo.id,
        pathWithNamespace: repo.pathWithNamespace
      })
      if (!result.ok) {
        if (isRequestCancelled(result.error)) return
        setError(result.error)
        return
      }
      onOpened(result.data)
    } catch {
      setError({
        code: 'open_failed',
        title: 'No se pudo abrir',
        message: 'Ocurrio un error al abrir el repositorio. Intenta de nuevo.'
      })
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <main className="panel" data-testid="repo-list-page" style={{ width: 'min(900px, 94vw)' }}>
      <div className="toolbar">
        <h1 style={{ margin: 0, flex: 1 }}>Repositorios</h1>
        <button
          className="btn"
          type="button"
          onClick={() => void handleLogout()}
          data-testid="logout-button"
        >
          {credentialsLocked ? 'Reconectar' : 'Cerrar sesion'}
        </button>
      </div>
      <div className="toolbar">
        <input
          data-testid="repo-search-input"
          placeholder="Buscar en GitLab…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {devMode ? (
        <div className="success" role="status" data-testid="dev-mode-banner">
          <strong>Modo desarrollo</strong>
          <div>
            Lista limitada al repo de prueba
            {testRepoPath ? (
              <>
                : <code>{testRepoPath}</code>
              </>
            ) : (
              ' (define AIDLC_TEST_REPO_URL en .env)'
            )}
          </div>
        </div>
      ) : null}
      {selected ? (
        <div className="success" role="status" data-testid="selected-repo-banner">
          <strong>Repositorio abierto</strong>
          <div>
            <code>{selected.pathWithNamespace}</code> · rama fija <code>{selected.branch}</code>
          </div>
          <div className="muted" style={{ marginTop: '0.35rem' }}>
            El visor de <code>aidlc-docs/</code> llega en la siguiente unidad. Por ahora la
            seleccion queda activa en la sesion.
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="error" role="alert" data-testid="repo-list-error">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}
      <div data-testid="repo-list">
        {items.map((repo) => {
          const isSelected = selected?.projectId === repo.id
          const isOpening = openingId === repo.id
          return (
            <div
              className={`repo-item${isSelected ? ' repo-item-selected' : ''}${isOpening ? ' repo-item-opening' : ''}`}
              key={repo.id}
              data-testid={`repo-item-${repo.id}`}
              role="button"
              tabIndex={0}
              aria-busy={isOpening}
              onClick={() => {
                if (openingId == null) void handleOpen(repo)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (openingId == null) void handleOpen(repo)
                }
              }}
            >
              <div>
                <div>
                  <strong>{repo.name}</strong>
                  {isSelected ? <span className="pill">Abierto</span> : null}
                  {isOpening ? <span className="pill">Abriendo…</span> : null}
                </div>
                <div className="muted">{repo.pathWithNamespace}</div>
                {repo.description ? <div className="muted">{repo.description}</div> : null}
              </div>
            </div>
          )
        })}
        {!loading && items.length === 0 ? (
          <p className="muted" data-testid="repo-list-empty">
            No hay repositorios para la busqueda actual.
          </p>
        ) : null}
      </div>
      <div style={{ marginTop: '1rem' }}>
        {hasMore ? (
          <button
            className="btn"
            type="button"
            disabled={loading || openingId != null}
            data-testid="repo-load-more-button"
            onClick={() => void load(page + 1, query, true)}
          >
            {loading ? 'Cargando…' : 'Cargar mas'}
          </button>
        ) : null}
        {loading && items.length > 0 ? <span className="muted"> Cargando…</span> : null}
      </div>
    </main>
  )
}
