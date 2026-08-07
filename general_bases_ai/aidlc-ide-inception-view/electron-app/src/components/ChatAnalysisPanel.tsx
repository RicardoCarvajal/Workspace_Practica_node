import { FormEvent, useCallback, useEffect, useState } from 'react'
import { isRequestCancelled, VALIDATION_ERROR } from '../../shared/errors'
import type { AppError } from '../../shared/types'
import type { ChatSessionState } from '../../shared/chat-rag'
import LoadingSpinner from './LoadingSpinner'

interface Props {
  projectId: number
  openPath: string | null
}

export default function ChatAnalysisPanel({
  projectId,
  openPath
}: Props): JSX.Element {
  const [session, setSession] = useState<ChatSessionState | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [indexing, setIndexing] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const indexReady = Boolean(session?.indexReady && (session?.indexChunkCount ?? 0) > 0)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await window.aidlcApi.chatGetSession({ projectId })
    setLoading(false)
    if (!result.ok) {
      if (isRequestCancelled(result.error)) return
      setError(result.error)
      return
    }
    setSession(result.data)
  }, [projectId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function onSend(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (!input.trim() || sending || indexing) return
    if (!indexReady) {
      setError(
        VALIDATION_ERROR(
          'Pulsa "Actualizar indice" antes de chatear. La indexacion usa Bedrock Titan y puede tardar.'
        )
      )
      return
    }
    setSending(true)
    setError(null)
    setInfo(null)
    const result = await window.aidlcApi.chatSend({
      projectId,
      message: input,
      openPath
    })
    setSending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSession(result.data.session)
    setInput('')
  }

  async function onReindex(): Promise<void> {
    setIndexing(true)
    setError(null)
    setInfo(null)
    const result = await window.aidlcApi.ragReindex({ projectId })
    setIndexing(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setInfo(
      `Indice listo: ${result.data.chunkCount} fragmentos en ${result.data.fileCount} archivos.`
    )
    await refresh()
  }

  return (
    <aside className="chat-panel" data-testid="chat-analysis-panel">
      <div className="panel-title">Chat de analisis (Nova)</div>
      <p className="muted chat-hint">
        Analiza la documentacion AIDLC. El indice se crea al abrir el repo; usa{' '}
        <strong>Actualizar indice</strong> solo si necesitas refrescarlo.
      </p>

      {session ? (
        <div className="obs-meta" data-testid="chat-token-stats">
          <div className="muted">
            Indice: {session.indexReady ? `${session.indexChunkCount} chunks` : 'no listo'}
          </div>
          <div>
            Ultimo mensaje — in: {session.lastUsage.inputTokens} / out:{' '}
            {session.lastUsage.outputTokens} / total: {session.lastUsage.totalTokens}
          </div>
          <div>
            Sesion — in: {session.sessionUsage.inputTokens} / out:{' '}
            {session.sessionUsage.outputTokens} / total: {session.sessionUsage.totalTokens}
          </div>
        </div>
      ) : null}

      {loading ? <p className="muted">Cargando sesion…</p> : null}
      {error ? (
        <div className="error" role="alert">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}
      {indexing ? (
        <div className="success" role="status" data-testid="chat-indexing-wait">
          <LoadingSpinner size="md" label="Espere, estamos indexando los documentos…" />
        </div>
      ) : null}
      {!indexing && info ? (
        <div className="success" role="status">
          {info}
        </div>
      ) : null}

      <div className="toolbar-actions" style={{ marginBottom: '0.75rem' }}>
        <button
          className="btn"
          type="button"
          disabled={indexing || sending}
          data-testid="chat-reindex-button"
          onClick={() => void onReindex()}
        >
          {indexing ? 'Indexando…' : 'Actualizar indice'}
        </button>
      </div>

      <div className="chat-messages" data-testid="chat-messages">
        {(session?.messages ?? []).map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={`chat-bubble chat-bubble-${m.role}`}
            data-testid={`chat-message-${i}`}
          >
            <div className="chat-role muted">{m.role === 'user' ? 'Tu' : 'Nova'}</div>
            <div className="chat-text">{m.content}</div>
            {m.role === 'assistant' && m.citations && m.citations.length > 0 ? (
              <div className="muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                Citas: {[...new Set(m.citations.map((c) => c.path))].join(', ')}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <form className="chat-form" onSubmit={(e) => void onSend(e)}>
        <label className="muted" htmlFor="chat-input">
          Pregunta sobre la documentacion
        </label>
        <textarea
          id="chat-input"
          className="chat-input"
          data-testid="chat-input"
          rows={3}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending || indexing}
        />
        <button
          className="btn"
          type="submit"
          disabled={sending || indexing || !input.trim() || !indexReady}
        >
          {sending ? 'Consultando Nova…' : indexReady ? 'Enviar' : 'Indice requerido'}
        </button>
      </form>
    </aside>
  )
}
