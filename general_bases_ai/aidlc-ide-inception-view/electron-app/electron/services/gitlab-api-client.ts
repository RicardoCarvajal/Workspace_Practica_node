import type {
  FileContent,
  FileEdit,
  GitLabAuthMode,
  RecentDiffView,
  RepoListResult,
  RepoSummary,
  RequestChangesResult,
  TreeNode
} from '../../shared/types'
import {
  BRANCH_MISSING,
  DIFF_UNAVAILABLE,
  FILE_NOT_PREVIEWABLE,
  INCEPTION_MISSING,
  LOGIN_FAILED,
  NETWORK_ERROR,
  PUBLISH_ERROR,
  REQUEST_CANCELLED,
  VALIDATION_ERROR
} from '../../shared/errors'
import type { AppError } from '../../shared/types'
import {
  DOCS_ROOT,
  assertUnderDocs,
  assertAllowedRepoPath,
  isMarkdownPath,
  isPreviewableTextPath,
  looksBinaryContent
} from '../../shared/path-guard'

const DEFAULT_PAGE_SIZE = 20
const TIMEOUT_MS = 30_000

export function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (!/^https:\/\//i.test(trimmed)) {
    throw VALIDATION_ERROR('La URL debe usar HTTPS (ej. https://git.intelix.biz)')
  }
  return trimmed
}

export function mapProject(raw: {
  id: number
  name: string
  path_with_namespace: string
  description?: string | null
}): RepoSummary {
  return {
    id: raw.id,
    name: raw.name,
    pathWithNamespace: raw.path_with_namespace,
    description: raw.description ?? undefined
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  signal?: AbortSignal
): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TIMEOUT_MS)

  const onAbort = (): void => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      // Superseded by takeAbort / Strict Mode remount — not a real network failure
      if (!timedOut && signal?.aborted) throw REQUEST_CANCELLED()
      throw NETWORK_ERROR()
    }
    throw NETWORK_ERROR()
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', onAbort)
  }
}

function basicHeaders(username: string, secret: string): Record<string, string> {
  const token = Buffer.from(`${username}:${secret}`, 'utf8').toString('base64')
  return {
    Authorization: `Basic ${token}`,
    Accept: 'application/json'
  }
}

function privateTokenHeaders(token: string): Record<string, string> {
  return {
    'PRIVATE-TOKEN': token,
    Accept: 'application/json'
  }
}

function looksLikePersonalAccessToken(secret: string): boolean {
  const s = secret.trim()
  return s.startsWith('glpat-') || s.startsWith('gloas-') || s.startsWith('gldt-')
}

/**
 * Authenticate against GitLab /api/v4/user.
 * Many self-hosted instances disable password Basic auth for the API;
 * in that case a Personal Access Token works via PRIVATE-TOKEN (or as Basic password).
 */
export async function authenticateUser(
  baseUrl: string,
  username: string,
  secret: string
): Promise<
  { ok: true; authMode: GitLabAuthMode } | { ok: false; error: AppError }
> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const user = username.trim()
    const passwordOrToken = secret
    const url = `${normalized}/api/v4/user`

    const attempts: Array<{ mode: GitLabAuthMode; headers: Record<string, string> }> =
      looksLikePersonalAccessToken(passwordOrToken)
        ? [
            { mode: 'private_token', headers: privateTokenHeaders(passwordOrToken) },
            { mode: 'basic', headers: basicHeaders(user, passwordOrToken) }
          ]
        : [
            { mode: 'basic', headers: basicHeaders(user, passwordOrToken) },
            { mode: 'private_token', headers: privateTokenHeaders(passwordOrToken) }
          ]

    let lastStatus = 0
    for (const attempt of attempts) {
      const res = await fetchWithTimeout(url, { method: 'GET', headers: attempt.headers })
      lastStatus = res.status
      if (res.ok) return { ok: true, authMode: attempt.mode }
      if (res.status !== 401 && res.status !== 403) {
        return { ok: false, error: NETWORK_ERROR() }
      }
    }

    if (lastStatus === 401 || lastStatus === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    return { ok: false, error: LOGIN_FAILED() }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

/** @deprecated Use authenticateUser */
export async function getCurrentUser(
  baseUrl: string,
  basicAuth: string
): Promise<{ ok: true } | { ok: false; error: AppError }> {
  const match = /^Basic\s+(.+)$/i.exec(basicAuth)
  if (!match) return { ok: false, error: LOGIN_FAILED() }
  const decoded = Buffer.from(match[1], 'base64').toString('utf8')
  const idx = decoded.indexOf(':')
  const username = idx >= 0 ? decoded.slice(0, idx) : decoded
  const password = idx >= 0 ? decoded.slice(idx + 1) : ''
  const result = await authenticateUser(baseUrl, username, password)
  if (!result.ok) return result
  return { ok: true }
}

export async function getProjectByPath(
  baseUrl: string,
  authHeaders: Record<string, string>,
  pathWithNamespace: string,
  signal?: AbortSignal
): Promise<{ ok: true; data: RepoSummary } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const encoded = encodeURIComponent(pathWithNamespace)
    const res = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${encoded}`,
      { method: 'GET', headers: authHeaders },
      signal
    )
    if (res.status === 404) {
      return {
        ok: false,
        error: VALIDATION_ERROR(`Repo de prueba no encontrado: ${pathWithNamespace}`)
      }
    }
    if (res.status === 401 || res.status === 403) return { ok: false, error: LOGIN_FAILED() }
    if (!res.ok) return { ok: false, error: NETWORK_ERROR() }
    const json = (await res.json()) as {
      id: number
      name: string
      path_with_namespace: string
      description?: string | null
    }
    return { ok: true, data: mapProject(json) }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

/**
 * Lists projects. When `devTestRepoPath` is set (AIDLC_DEV_MODE), returns only that project.
 */
export async function listProjects(
  baseUrl: string,
  authHeaders: Record<string, string>,
  opts: {
    page?: number
    pageSize?: number
    search?: string
    signal?: AbortSignal
    /** When set, only this path_with_namespace is returned (dev mode). */
    devTestRepoPath?: string | null
  }
): Promise<{ ok: true; data: RepoListResult } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const page = opts.page ?? 1
    const pageSize = opts.pageSize ?? DEFAULT_PAGE_SIZE
    const search = opts.search?.trim() ?? ''
    const testPath = opts.devTestRepoPath?.trim()

    if (testPath) {
      if (page > 1) {
        return {
          ok: true,
          data: { items: [], page, pageSize, hasMore: false, searchQuery: search }
        }
      }
      const one = await getProjectByPath(normalized, authHeaders, testPath, opts.signal)
      if (!one.ok) return one
      const matchSearch =
        !search ||
        one.data.name.toLowerCase().includes(search.toLowerCase()) ||
        one.data.pathWithNamespace.toLowerCase().includes(search.toLowerCase())
      return {
        ok: true,
        data: {
          items: matchSearch ? [one.data] : [],
          page: 1,
          pageSize,
          hasMore: false,
          searchQuery: search
        }
      }
    }

    const params = new URLSearchParams({
      membership: 'true',
      simple: 'true',
      per_page: String(pageSize),
      page: String(page),
      order_by: 'last_activity_at',
      sort: 'desc'
    })
    if (search) params.set('search', search)

    const res = await fetchWithTimeout(
      `${normalized}/api/v4/projects?${params}`,
      { method: 'GET', headers: authHeaders },
      opts.signal
    )
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    if (!res.ok) return { ok: false, error: NETWORK_ERROR() }
    const json = (await res.json()) as Array<{
      id: number
      name: string
      path_with_namespace: string
      description?: string | null
    }>
    const items = json.map(mapProject)
    const hasMore = items.length >= pageSize
    return {
      ok: true,
      data: { items, page, pageSize, hasMore, searchQuery: search }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

export async function branchExists(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  branch = 'dev',
  signal?: AbortSignal
): Promise<{ ok: true } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const encoded = encodeURIComponent(branch)
    const res = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/branches/${encoded}`,
      { method: 'GET', headers: authHeaders },
      signal
    )
    if (res.status === 404) return { ok: false, error: BRANCH_MISSING() }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    if (!res.ok) return { ok: false, error: NETWORK_ERROR() }
    return { ok: true }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

function encodeFilePath(path: string): string {
  return encodeURIComponent(path).replace(/\./g, '%2E')
}

export async function listTree(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  path: string = DOCS_ROOT,
  signal?: AbortSignal
): Promise<{ ok: true; data: TreeNode[] } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const safePath = assertUnderDocs(path)
    const params = new URLSearchParams({
      path: safePath,
      ref: 'dev',
      per_page: '100'
    })
    const res = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/tree?${params}`,
      { method: 'GET', headers: authHeaders },
      signal
    )
    if (res.status === 404) {
      if (safePath === DOCS_ROOT) return { ok: false, error: INCEPTION_MISSING() }
      return { ok: false, error: NETWORK_ERROR() }
    }
    if (res.status === 401 || res.status === 403) return { ok: false, error: LOGIN_FAILED() }
    if (!res.ok) return { ok: false, error: NETWORK_ERROR() }
    const json = (await res.json()) as Array<{ name: string; path: string; type: string }>
    const nodes: TreeNode[] = json
      .filter((n) => n.type === 'tree' || n.type === 'blob')
      .map((n) => ({
        name: n.name,
        path: n.path,
        type: n.type === 'tree' ? 'tree' : 'blob'
      }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
    return { ok: true, data: nodes }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

/**
 * Lists blob paths under a path (recursive, paginated), markdown preferred.
 */
export async function listBlobPathsUnder(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  rootPath: string,
  signal?: AbortSignal
): Promise<{ ok: true; data: string[] } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const safeRoot = assertUnderDocs(rootPath)
    const blobs: string[] = []
    let page = 1
    for (;;) {
      const params = new URLSearchParams({
        path: safeRoot,
        ref: 'dev',
        recursive: 'true',
        per_page: '100',
        page: String(page)
      })
      const res = await fetchWithTimeout(
        `${normalized}/api/v4/projects/${projectId}/repository/tree?${params}`,
        { method: 'GET', headers: authHeaders },
        signal
      )
      if (res.status === 404) {
        // Empty directory is fine
        return { ok: true, data: [] }
      }
      if (res.status === 401 || res.status === 403) return { ok: false, error: LOGIN_FAILED() }
      if (!res.ok) return { ok: false, error: NETWORK_ERROR() }
      const json = (await res.json()) as Array<{ path: string; type: string }>
      for (const n of json) {
        if (n.type === 'blob' && n.path) blobs.push(n.path)
      }
      const next = res.headers.get('x-next-page')
      if (!next) break
      page = Number(next)
      if (!Number.isFinite(page) || page < 1) break
    }

    const md = blobs.filter((p) => isMarkdownPath(p))
    const chosen = md.length ? md : blobs.filter((p) => isPreviewableTextPath(p))
    chosen.sort((a, b) => a.localeCompare(b))
    return { ok: true, data: chosen }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

/**
 * Lists all blob paths under aidlc-docs (recursive, paginated).
 */
export async function listInceptionBlobPaths(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  signal?: AbortSignal
): Promise<{ ok: true; data: string[] } | { ok: false; error: AppError }> {
  const listed = await listBlobPathsUnder(
    baseUrl,
    authHeaders,
    projectId,
    DOCS_ROOT,
    signal
  )
  if (!listed.ok) {
    if (listed.error.code === 'network_error') {
      // preserve missing semantics when root missing
      const probe = await listTree(baseUrl, authHeaders, projectId, DOCS_ROOT, signal)
      if (!probe.ok && probe.error.code === 'inception_missing') return probe
    }
    return listed
  }
  return listed
}

export async function getFileContent(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  path: string,
  signal?: AbortSignal
): Promise<{ ok: true; data: Omit<FileContent, 'fromDraft'> } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const safePath = assertAllowedRepoPath(path)
    if (!isPreviewableTextPath(safePath)) {
      return { ok: false, error: FILE_NOT_PREVIEWABLE() }
    }
    const res = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/files/${encodeFilePath(safePath)}?ref=dev`,
      { method: 'GET', headers: authHeaders },
      signal
    )
    if (res.status === 404) {
      return {
        ok: false,
        error: VALIDATION_ERROR('Archivo no encontrado en la rama dev.')
      }
    }
    if (res.status === 401 || res.status === 403) return { ok: false, error: LOGIN_FAILED() }
    if (!res.ok) return { ok: false, error: NETWORK_ERROR() }
    const json = (await res.json()) as {
      file_path: string
      encoding: string
      content: string
      blob_id?: string
    }
    if (json.encoding !== 'base64') {
      return { ok: false, error: FILE_NOT_PREVIEWABLE() }
    }
    const text = Buffer.from(json.content, 'base64').toString('utf8')
    if (looksBinaryContent(text)) {
      return { ok: false, error: FILE_NOT_PREVIEWABLE() }
    }
    return {
      ok: true,
      data: {
        path: safePath,
        branch: 'dev',
        content: text,
        isMarkdown: isMarkdownPath(safePath),
        sha: json.blob_id
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: NETWORK_ERROR() }
  }
}

export async function getFileRecentDiff(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  path: string,
  signal?: AbortSignal
): Promise<{ ok: true; data: RecentDiffView } | { ok: false; error: AppError }> {
  try {
    const normalized = normalizeBaseUrl(baseUrl)
    const safePath = assertAllowedRepoPath(path)
    const commitsParams = new URLSearchParams({
      path: safePath,
      ref_name: 'dev',
      per_page: '1'
    })
    const commitsRes = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/commits?${commitsParams}`,
      { method: 'GET', headers: authHeaders },
      signal
    )
    if (commitsRes.status === 401 || commitsRes.status === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    if (!commitsRes.ok) return { ok: false, error: DIFF_UNAVAILABLE() }
    const commits = (await commitsRes.json()) as Array<{
      id: string
      short_id: string
      title: string
      author_name?: string
      committed_date?: string
    }>
    if (!commits.length) return { ok: false, error: DIFF_UNAVAILABLE() }
    const commit = commits[0]
    const diffRes = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/commits/${commit.id}/diff`,
      { method: 'GET', headers: authHeaders },
      signal
    )
    if (!diffRes.ok) return { ok: false, error: DIFF_UNAVAILABLE() }
    const diffs = (await diffRes.json()) as Array<{
      old_path?: string
      new_path?: string
      diff?: string
    }>
    const match =
      diffs.find((d) => d.new_path === safePath || d.old_path === safePath) ?? diffs[0]
    const unified = match?.diff?.trim()
      ? match.diff
      : 'Sin diferencias textuales en el ultimo commit (posible renombre o binario).'
    return {
      ok: true,
      data: {
        path: safePath,
        commitId: commit.short_id || commit.id.slice(0, 8),
        commitTitle: commit.title || '(sin titulo)',
        authorName: commit.author_name,
        committedAt: commit.committed_date,
        unifiedDiff: unified
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: DIFF_UNAVAILABLE() }
  }
}

async function fileExistsOnDev(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  path: string,
  signal?: AbortSignal
): Promise<boolean> {
  const encoded = encodeURIComponent(path).replace(/\./g, '%2E')
  const res = await fetchWithTimeout(
    `${baseUrl}/api/v4/projects/${projectId}/repository/files/${encoded}?ref=dev`,
    { method: 'HEAD', headers: authHeaders },
    signal
  )
  // Some GitLab versions don't support HEAD on files — fallback GET
  if (res.status === 404) return false
  if (res.ok) return true
  const getRes = await fetchWithTimeout(
    `${baseUrl}/api/v4/projects/${projectId}/repository/files/${encoded}?ref=dev`,
    { method: 'GET', headers: authHeaders },
    signal
  )
  return getRes.ok
}

/**
 * Commits file changes directly onto branch `dev` (no Merge Request).
 */
export async function pushFilesToDev(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  edits: FileEdit[],
  opts?: { commitMessage?: string; signal?: AbortSignal }
): Promise<
  | { ok: true; data: { branch: 'dev'; commitId: string; filesCommitted: string[] } }
  | { ok: false; error: AppError }
> {
  try {
    if (!edits.length) {
      return {
        ok: false,
        error: VALIDATION_ERROR('No hay cambios locales para hacer push a dev.')
      }
    }

    const normalized = normalizeBaseUrl(baseUrl)
    const stamp = new Date().toISOString()
    const commitMessage =
      opts?.commitMessage?.trim() || `ATE AI-DLC IDE: observaciones ${stamp}`

    const actions: Array<{
      action: 'create' | 'update'
      file_path: string
      content: string
    }> = []

    for (const edit of edits) {
      const path = assertAllowedRepoPath(edit.path)
      const exists = await fileExistsOnDev(
        normalized,
        authHeaders,
        projectId,
        path,
        opts?.signal
      )
      actions.push({
        action: exists ? 'update' : 'create',
        file_path: path,
        content: edit.content
      })
    }

    const commitRes = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/commits`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch: 'dev',
          commit_message: commitMessage,
          actions
        })
      },
      opts?.signal
    )

    if (commitRes.status === 401 || commitRes.status === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    if (!commitRes.ok) {
      const body = await commitRes.text().catch(() => '')
      return {
        ok: false,
        error: PUBLISH_ERROR(
          `No se pudo hacer push a la rama dev. ${body.slice(0, 180)}`
        )
      }
    }

    const commit = (await commitRes.json()) as { id?: string; short_id?: string }
    return {
      ok: true,
      data: {
        branch: 'dev',
        commitId: commit.short_id || commit.id || 'ok',
        filesCommitted: actions.map((a) => a.file_path)
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: PUBLISH_ERROR() }
  }
}

/**
 * Creates a branch from `dev`, commits all draft edits, opens MR targeting `dev`.
 * @deprecated Prefer pushFilesToDev for observations workflow.
 */
export async function publishDraftsAsMergeRequest(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  edits: FileEdit[],
  opts?: { title?: string; description?: string; signal?: AbortSignal }
): Promise<{ ok: true; data: RequestChangesResult } | { ok: false; error: AppError }> {
  try {
    if (!edits.length) {
      return {
        ok: false,
        error: VALIDATION_ERROR('No hay borradores locales para solicitar cambios.')
      }
    }

    const normalized = normalizeBaseUrl(baseUrl)
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const branch = `aidlc-changes-${stamp}`
    const title =
      opts?.title?.trim() || `Cambios AI-DLC inception (${stamp})`
    const description =
      opts?.description?.trim() ||
      'Merge Request generado desde ATE AI-DLC IDE con borradores locales (observaciones / edicion manual). Destino: rama `dev`.'

    const actions: Array<{
      action: 'create' | 'update'
      file_path: string
      content: string
    }> = []

    for (const edit of edits) {
      const path = assertAllowedRepoPath(edit.path)
      const exists = await fileExistsOnDev(
        normalized,
        authHeaders,
        projectId,
        path,
        opts?.signal
      )
      actions.push({
        action: exists ? 'update' : 'create',
        file_path: path,
        content: edit.content
      })
    }

    const commitRes = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/repository/commits`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          start_branch: 'dev',
          commit_message: title,
          actions
        })
      },
      opts?.signal
    )

    if (commitRes.status === 401 || commitRes.status === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    if (!commitRes.ok) {
      const body = await commitRes.text().catch(() => '')
      return {
        ok: false,
        error: PUBLISH_ERROR(
          `No se pudo crear el commit en la rama ${branch}. ${body.slice(0, 180)}`
        )
      }
    }

    const mrRes = await fetchWithTimeout(
      `${normalized}/api/v4/projects/${projectId}/merge_requests`,
      {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_branch: branch,
          target_branch: 'dev',
          title,
          description,
          remove_source_branch: false
        })
      },
      opts?.signal
    )

    if (mrRes.status === 401 || mrRes.status === 403) {
      return { ok: false, error: LOGIN_FAILED() }
    }
    if (!mrRes.ok) {
      const body = await mrRes.text().catch(() => '')
      return {
        ok: false,
        error: PUBLISH_ERROR(
          `Commit creado en ${branch}, pero fallo la creacion del MR. ${body.slice(0, 180)}`
        )
      }
    }

    const mr = (await mrRes.json()) as {
      iid: number
      web_url: string
    }

    return {
      ok: true,
      data: {
        branch,
        mergeRequestIid: mr.iid,
        mergeRequestUrl: mr.web_url,
        filesCommitted: actions.map((a) => a.file_path)
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: PUBLISH_ERROR() }
  }
}
