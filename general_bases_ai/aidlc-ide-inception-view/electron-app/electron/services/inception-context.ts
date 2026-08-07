import type { AppError, ChatMessage } from '../../shared/types'
import { isMarkdownPath } from '../../shared/path-guard'
import { looksLikeModificationRequest } from '../../shared/chat-intent'
import * as gitlab from './gitlab-api-client'
import * as draftStore from '../stores/draft-file-store'

/** Soft budgets to keep Bedrock prompt small. */
const MAX_FILES_TO_INDEX = 60
const MAX_HEADINGS = 10
const SNIPPET_CHARS = 160
const MAX_INDEX_CHARS = 10_000
const MAX_RELEVANT_FILES = 5
const MAX_RELEVANT_CHARS = 4_500
/** Larger budget when the user asks to edit/unify docs (agent needs fuller source). */
const MAX_RELEVANT_FILES_AGENT = 4
const MAX_RELEVANT_CHARS_AGENT = 14_000
const MAX_SELECTED_CHARS = 5_000
const MAX_SELECTED_CHARS_AGENT = 14_000
const FETCH_CONCURRENCY = 6
const CACHE_TTL_MS = 10 * 60 * 1000

export interface FileIndexEntry {
  path: string
  title: string
  headings: string[]
  ids: string[]
  snippet: string
}

export interface WorkspaceChatContext {
  indexText: string
  relevantDocsText: string
  selectedContentTruncated: string | null
  indexedFileCount: number
  relevantPaths: string[]
}

interface CacheEntry {
  builtAt: number
  entries: FileIndexEntry[]
  contents: Map<string, string>
}

const cacheByProject = new Map<number, CacheEntry>()

const ID_RE = /\b(?:HU|US|FR|NFR|BR)-[\w.-]+/gi

export function clearInceptionContextCache(projectId?: number): void {
  if (projectId == null) cacheByProject.clear()
  else cacheByProject.delete(projectId)
}

export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n…[truncado ${text.length - maxChars} chars]`
}

/** Pure helper — extract compact metadata from a markdown/text file. */
export function extractFileIndexEntry(path: string, content: string): FileIndexEntry {
  const lines = content.split(/\r?\n/)
  let title = ''
  const headings: string[] = []
  const ids = new Set<string>()

  for (const line of lines) {
    for (const m of line.matchAll(ID_RE)) {
      ids.add(m[0].toUpperCase())
    }
    const h = /^(#{1,3})\s+(.+?)\s*$/.exec(line)
    if (!h) continue
    const level = h[1].length
    const text = h[2].trim()
    if (level === 1 && !title) title = text
    else if (headings.length < MAX_HEADINGS) headings.push(text)
  }

  if (!title) {
    title = path.split('/').pop()?.replace(/\.md$/i, '') || path
  }

  const body = lines
    .filter((l) => !/^#{1,6}\s/.test(l) && l.trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    path,
    title,
    headings,
    ids: [...ids].slice(0, 24),
    snippet: body.slice(0, SNIPPET_CHARS)
  }
}

export function formatIndexText(entries: FileIndexEntry[]): string {
  const lines: string[] = [
    'INDICE COMPACTO de aidlc-docs/ (usa esto para ubicar archivos; no inventes HUs):'
  ]
  let used = lines[0].length
  let included = 0
  for (const e of entries) {
    const parts = [
      `- ${e.path}`,
      `  titulo: ${e.title}`,
      e.ids.length ? `  ids: ${e.ids.join(', ')}` : '',
      e.headings.length ? `  secciones: ${e.headings.slice(0, 8).join(' | ')}` : '',
      e.snippet ? `  extracto: ${e.snippet}` : ''
    ].filter(Boolean)
    const block = parts.join('\n')
    if (used + block.length + 1 > MAX_INDEX_CHARS) {
      const omitted = entries.length - included
      if (omitted > 0) {
        lines.push(`…(+${omitted} archivos omitidos del indice por limite de tokens)`)
      }
      break
    }
    lines.push(block)
    used += block.length + 1
    included += 1
  }
  return lines.join('\n')
}

function tokenizeQuery(q: string): string[] {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9áéíóúñü._/-]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
}

/** Score how relevant an indexed file is to the user query. */
export function scoreFileForQuery(entry: FileIndexEntry, query: string): number {
  const tokens = tokenizeQuery(query)
  if (!tokens.length) return 0
  const hay = [
    entry.path,
    entry.title,
    entry.headings.join(' '),
    entry.ids.join(' '),
    entry.snippet
  ]
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  let score = 0
  for (const t of tokens) {
    if (hay.includes(t)) score += t.length >= 4 ? 3 : 1
  }
  // Boost typical story/gap docs
  if (/user-stor|historias|brecha|gap|hu[-_]|stories/i.test(entry.path)) score += 4
  if (/brecha|gap/i.test(query) && /brecha|gap/i.test(hay)) score += 6
  if (/\bhu\b|historias?/i.test(query) && (/hu|historias|user-stor/i.test(hay) || entry.ids.some((id) => id.startsWith('HU') || id.startsWith('US')))) {
    score += 5
  }
  return score
}

export function selectRelevantPaths(
  entries: FileIndexEntry[],
  query: string,
  selectedPath?: string | null,
  limit = MAX_RELEVANT_FILES
): string[] {
  const scored = entries
    .map((e) => ({ path: e.path, score: scoreFileForQuery(e, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)

  const out: string[] = []
  const push = (p?: string | null): void => {
    if (!p || out.includes(p)) return
    out.push(p)
  }

  push(selectedPath)
  for (const s of scored) {
    if (out.length >= limit) break
    push(s.path)
  }

  // If query is about HUs/brecha but scoring weak, force top story-like paths
  if (out.length < 2 && /\bhu\b|brecha|historias?/i.test(query)) {
    for (const e of entries) {
      if (out.length >= limit) break
      if (/user-stor|historias|brecha|gap|stories/i.test(e.path)) push(e.path)
    }
  }

  return out.slice(0, limit)
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let i = 0
  async function worker(): Promise<void> {
    for (;;) {
      const idx = i++
      if (idx >= items.length) return
      results[idx] = await fn(items[idx])
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length))
  await Promise.all(Array.from({ length: n }, () => worker()))
  return results
}

async function ensureCache(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  signal?: AbortSignal
): Promise<{ ok: true; data: CacheEntry } | { ok: false; error: AppError }> {
  const existing = cacheByProject.get(projectId)
  if (existing && Date.now() - existing.builtAt < CACHE_TTL_MS) {
    return { ok: true, data: existing }
  }

  const listed = await gitlab.listInceptionBlobPaths(baseUrl, authHeaders, projectId, signal)
  if (!listed.ok) return listed

  const paths = listed.data.filter((p) => isMarkdownPath(p)).slice(0, MAX_FILES_TO_INDEX)
  const contents = new Map<string, string>()
  const entries: FileIndexEntry[] = []

  await mapPool(paths, FETCH_CONCURRENCY, async (path) => {
    const draft = draftStore.readDraft(projectId, path)
    if (draft != null) {
      contents.set(path, draft)
      entries.push(extractFileIndexEntry(path, draft))
      return
    }
    const file = await gitlab.getFileContent(baseUrl, authHeaders, projectId, path, signal)
    if (!file.ok) return
    contents.set(path, file.data.content)
    entries.push(extractFileIndexEntry(path, file.data.content))
  })

  entries.sort((a, b) => a.path.localeCompare(b.path))
  const entry: CacheEntry = { builtAt: Date.now(), entries, contents }
  cacheByProject.set(projectId, entry)
  return { ok: true, data: entry }
}

/** Prefetch index when opening a repo (non-blocking caller). */
export async function warmInceptionContext(
  baseUrl: string,
  authHeaders: Record<string, string>,
  projectId: number,
  signal?: AbortSignal
): Promise<void> {
  await ensureCache(baseUrl, authHeaders, projectId, signal)
}

export async function buildWorkspaceChatContext(opts: {
  baseUrl: string
  authHeaders: Record<string, string>
  projectId: number
  messages: ChatMessage[]
  selectedPath?: string | null
  selectedContent?: string | null
  signal?: AbortSignal
}): Promise<{ ok: true; data: WorkspaceChatContext } | { ok: false; error: AppError }> {
  const cached = await ensureCache(
    opts.baseUrl,
    opts.authHeaders,
    opts.projectId,
    opts.signal
  )
  if (!cached.ok) return cached

  const lastUser =
    [...opts.messages].reverse().find((m) => m.role === 'user')?.content || ''
  const agentEdit = looksLikeModificationRequest(lastUser)
  const maxFiles = agentEdit ? MAX_RELEVANT_FILES_AGENT : MAX_RELEVANT_FILES
  const maxDocChars = agentEdit ? MAX_RELEVANT_CHARS_AGENT : MAX_RELEVANT_CHARS
  const maxSelected = agentEdit ? MAX_SELECTED_CHARS_AGENT : MAX_SELECTED_CHARS

  // Refresh selected path into cache (drafts may be newer)
  if (opts.selectedPath && opts.selectedContent != null) {
    cached.data.contents.set(opts.selectedPath, opts.selectedContent)
    const idx = cached.data.entries.findIndex((e) => e.path === opts.selectedPath)
    const entry = extractFileIndexEntry(opts.selectedPath, opts.selectedContent)
    if (idx >= 0) cached.data.entries[idx] = entry
    else cached.data.entries.push(entry)
  }

  const relevantPaths = selectRelevantPaths(
    cached.data.entries,
    lastUser,
    opts.selectedPath,
    maxFiles
  )

  const docBlocks: string[] = []
  for (const path of relevantPaths) {
    let content = cached.data.contents.get(path)
    const draft = draftStore.readDraft(opts.projectId, path)
    if (draft != null) content = draft
    if (content == null) {
      const file = await gitlab.getFileContent(
        opts.baseUrl,
        opts.authHeaders,
        opts.projectId,
        path,
        opts.signal
      )
      if (!file.ok) continue
      content = file.data.content
      cached.data.contents.set(path, content)
    }
    docBlocks.push(`### FILE: ${path}\n${truncateText(content, maxDocChars)}`)
  }

  const agentHint = agentEdit
    ? [
        'MODO AGENTE ACTIVO: el usuario pidio modificar documentacion.',
        'Debes devolver edits[] con el contenido COMPLETO de cada archivo que cambies.',
        'No te limites a proponer un ejemplo en message: aplica la unificacion/cambio en los archivos DOCUMENTOS RELEVANTES (o crea/actualiza la ruta adecuada del indice).',
        'Si unificas HUs, actualiza el archivo destino (p. ej. principales o el que corresponda) y, si aplica, deja el de brecha sin duplicar o con referencia a la HU unificada.'
      ].join(' ')
    : ''

  return {
    ok: true,
    data: {
      indexText: formatIndexText(cached.data.entries),
      relevantDocsText: [
        agentHint,
        docBlocks.length
          ? `DOCUMENTOS RELEVANTES (fuente para editar; puede estar truncado):\n\n${docBlocks.join('\n\n')}`
          : 'DOCUMENTOS RELEVANTES: ninguno seleccionado automaticamente; usa el indice y elige rutas concretas en edits[].'
      ]
        .filter(Boolean)
        .join('\n\n'),
      selectedContentTruncated:
        opts.selectedPath && opts.selectedContent != null
          ? truncateText(opts.selectedContent, maxSelected)
          : null,
      indexedFileCount: cached.data.entries.length,
      relevantPaths
    }
  }
}
