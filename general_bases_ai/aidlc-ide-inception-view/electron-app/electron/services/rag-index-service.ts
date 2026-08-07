import type { AppError } from '../../shared/types'
import type { RagReindexResult } from '../../shared/chat-rag'
import { DOCS_ROOT, asAppError } from '../../shared/path-guard'
import { DRAFT_ERROR, VALIDATION_ERROR } from '../../shared/errors'
import { chunkMarkdown, isRagIndexablePath } from '../../shared/rag-chunk'
import { DEFAULT_RAG_TOP_K } from '../../shared/ai-config'
import { isUnderObservationsDir } from '../../shared/observations'
import * as gitlab from './gitlab-api-client'
import { embedTexts } from './bedrock-embeddings'
import { getLanceStore, type VectorRow } from './lancedb-store'
import { setIndexMeta } from '../stores/chat-session-store'

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

async function collectInceptionMarkdown(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<{ ok: true; data: Array<{ path: string; content: string }> } | { ok: false; error: AppError }> {
  const listed = await gitlab.listBlobPathsUnder(
    opts.baseUrl,
    opts.auth,
    opts.projectId,
    DOCS_ROOT,
    opts.signal
  )
  if (!listed.ok) return listed

  const files: Array<{ path: string; content: string }> = []
  for (const path of listed.data) {
    if (!isRagIndexablePath(path)) continue
    if (isUnderObservationsDir(path)) continue
    const remote = await gitlab.getFileContent(
      opts.baseUrl,
      opts.auth,
      opts.projectId,
      path,
      opts.signal
    )
    if (!remote.ok) continue
    files.push({ path, content: remote.data.content })
  }
  return { ok: true, data: files }
}

export async function reindexProject(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<{ ok: true; data: RagReindexResult } | { ok: false; error: AppError }> {
  try {
    const collected = await collectInceptionMarkdown(opts)
    if (!collected.ok) return collected

    const textChunks = collected.data.flatMap((f) => chunkMarkdown(f.path, f.content))
    const store = getLanceStore(opts.projectId)

    if (textChunks.length === 0) {
      store.replaceAll([])
      setIndexMeta(opts.projectId, { chunkCount: 0, ready: true })
      return {
        ok: true,
        data: { projectId: opts.projectId, chunkCount: 0, fileCount: collected.data.length }
      }
    }

    const embedded = await embedTexts(textChunks.map((c) => c.text))
    if (!embedded.ok) return embedded

    const rows: VectorRow[] = textChunks.map((c, i) => ({
      ...c,
      vector: embedded.data[i] ?? []
    })).filter((r) => r.vector.length > 0)

    store.replaceAll(rows)
    setIndexMeta(opts.projectId, { chunkCount: rows.length, ready: true })

    return {
      ok: true,
      data: {
        projectId: opts.projectId,
        chunkCount: rows.length,
        fileCount: collected.data.length
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    if (asAppError(e)) return { ok: false, error: asAppError(e)! }
    return { ok: false, error: DRAFT_ERROR() }
  }
}

export async function ensureIndex(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  signal?: AbortSignal
}): Promise<{ ok: true; data: RagReindexResult & { skipped: boolean } } | { ok: false; error: AppError }> {
  const store = getLanceStore(opts.projectId)
  const count = store.count()
  if (count > 0) {
    setIndexMeta(opts.projectId, { chunkCount: count, ready: true })
    return {
      ok: true,
      data: {
        projectId: opts.projectId,
        chunkCount: count,
        fileCount: -1,
        skipped: true
      }
    }
  }
  const built = await reindexProject(opts)
  if (!built.ok) return built
  return { ok: true, data: { ...built.data, skipped: false } }
}

export async function retrieveChunks(opts: {
  projectId: number
  query: string
  topK?: number
}): Promise<{ ok: true; data: Array<{ path: string; text: string }> } | { ok: false; error: AppError }> {
  const store = getLanceStore(opts.projectId)
  if (store.count() === 0) {
    return { ok: false, error: VALIDATION_ERROR('El indice vectorial esta vacio. Usa "Actualizar indice" en el chat.') }
  }
  const embedded = await embedTexts([opts.query])
  if (!embedded.ok) return embedded
  const vector = embedded.data[0]
  if (!vector) {
    return { ok: false, error: VALIDATION_ERROR('No se pudo embeddear la consulta.') }
  }
  const hits = store.search(vector, opts.topK ?? DEFAULT_RAG_TOP_K)
  return {
    ok: true,
    data: hits.map((h) => ({ path: h.path, text: h.text }))
  }
}
