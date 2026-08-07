import { useCallback, useEffect, useRef, useState } from 'react'
import { isRequestCancelled } from '../../shared/errors'
import type { AppError, SelectedProjectContext } from '../../shared/types'
import LoadingSpinner from '../components/LoadingSpinner'

interface Props {
  context: SelectedProjectContext
  onReady: () => void
  onBack: () => void
}

export default function IndexingPage({ context, onReady, onBack }: Props): JSX.Element {
  const [error, setError] = useState<AppError | null>(null)
  const [busy, setBusy] = useState(true)
  const [status, setStatus] = useState('Comprobando indice…')
  const [attempt, setAttempt] = useState(0)
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    setError(null)
    setStatus('Comprobando indice…')

    void (async () => {
      const result = await window.aidlcApi.ragEnsureIndex({ projectId: context.projectId })
      if (cancelled) return
      if (!result.ok) {
        setBusy(false)
        if (isRequestCancelled(result.error)) return
        setError(result.error)
        return
      }
      if (result.data.skipped) {
        setStatus(`Indice listo (${result.data.chunkCount} fragmentos).`)
      } else {
        setStatus(`Indice creado (${result.data.chunkCount} fragmentos).`)
      }
      setBusy(false)
      onReadyRef.current()
    })()

    return () => {
      cancelled = true
    }
  }, [context.projectId, attempt])

  useEffect(() => {
    if (!busy) return
    const t = window.setTimeout(() => {
      setStatus((prev) =>
        prev === 'Comprobando indice…'
          ? 'Espere, estamos indexando los documentos…'
          : prev
      )
    }, 300)
    return () => window.clearTimeout(t)
  }, [busy, attempt])

  const retry = useCallback(() => {
    setAttempt((n) => n + 1)
  }, [])

  return (
    <main className="panel" data-testid="indexing-page">
      <h1>Preparando repositorio</h1>
      <p className="muted">{context.pathWithNamespace}</p>

      {busy ? (
        <div className="success" role="status" data-testid="indexing-wait">
          <LoadingSpinner size="lg" label={status} />
        </div>
      ) : null}

      {!busy && error ? (
        <div className="error" role="alert">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}

      <div className="toolbar-actions" style={{ marginTop: '1rem' }}>
        <button className="btn" type="button" onClick={onBack} disabled={busy}>
          Volver a repositorios
        </button>
        {error ? (
          <button
            className="btn"
            type="button"
            data-testid="indexing-retry"
            onClick={retry}
          >
            Reintentar indexacion
          </button>
        ) : null}
      </div>
    </main>
  )
}
