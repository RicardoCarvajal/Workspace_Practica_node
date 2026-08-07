import type { AppError } from '../../shared/types'
import type { ChatSendResult } from '../../shared/chat-rag'
import { VALIDATION_ERROR } from '../../shared/errors'
import { asAppError } from '../../shared/path-guard'
import { runAnalysisChat } from './bedrock-analysis-chat'
import { ensureIndex, retrieveChunks } from './rag-index-service'
import {
  appendChatTurn,
  getChatSession,
  setIndexMeta
} from '../stores/chat-session-store'
import { getLanceStore } from './lancedb-store'

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

export async function chatSend(opts: {
  baseUrl: string
  auth: Record<string, string>
  projectId: number
  message: string
  openPath?: string | null
  signal?: AbortSignal
}): Promise<{ ok: true; data: ChatSendResult } | { ok: false; error: AppError }> {
  try {
    const text = opts.message.trim()
    if (!text) {
      return { ok: false, error: VALIDATION_ERROR('Escribe un mensaje.') }
    }

    const indexed = await ensureIndex({
      baseUrl: opts.baseUrl,
      auth: opts.auth,
      projectId: opts.projectId,
      signal: opts.signal
    })
    if (!indexed.ok) return indexed

    const retrieved = await retrieveChunks({
      projectId: opts.projectId,
      query: text
    })
    if (!retrieved.ok) return retrieved

    const session = getChatSession(opts.projectId)
    const history = session.messages.map((m) => ({
      role: m.role,
      content: m.content
    }))

    const replied = await runAnalysisChat({
      history,
      userMessage: text,
      chunks: retrieved.data,
      openPath: opts.openPath
    })
    if (!replied.ok) return replied

    const assistant = {
      role: 'assistant' as const,
      content: replied.data.message,
      citations: replied.data.citations,
      usage: replied.data.usage
    }
    const next = appendChatTurn(opts.projectId, text, assistant, replied.data.usage)
    setIndexMeta(opts.projectId, {
      chunkCount: getLanceStore(opts.projectId).count(),
      ready: true
    })

    return {
      ok: true,
      data: {
        session: next,
        assistantMessage: replied.data.message,
        citations: replied.data.citations,
        usage: replied.data.usage
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    if (asAppError(e)) return { ok: false, error: asAppError(e)! }
    return { ok: false, error: VALIDATION_ERROR('No se pudo completar el chat.') }
  }
}
