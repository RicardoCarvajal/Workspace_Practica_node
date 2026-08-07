import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { isRequestCancelled } from '../../shared/errors'
import { hasObservationEntries } from '../../shared/observations'
import type { AppError, ObservationsPullResult, ObservationsState } from '../../shared/types'
import { renderMarkdownSafe } from '../lib/markdown'

interface Props {
  projectId: number
  relatedPath: string | null
  refreshKey?: number
  /** Increment from parent toolbar «Actualizar» to refresh observations from GitLab. */
  pullKey?: number
  onPullBusyChange?: (busy: boolean) => void
}

export default function ObservationsPanel({
  projectId,
  relatedPath,
  refreshKey = 0,
  pullKey = 0,
  onPullBusyChange
}: Props): JSX.Element {
  const [state, setState] = useState<ObservationsState | null>(null)
  const [open, setOpen] = useState(true)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [closing, setClosing] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pull, setPull] = useState<ObservationsPullResult | null>(null)
  const [previewPath, setPreviewPath] = useState<string | null>(null)
  const openRef = useRef(open)
  openRef.current = open
  const onPullBusyChangeRef = useRef(onPullBusyChange)
  onPullBusyChangeRef.current = onPullBusyChange

  const loadOwn = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await window.aidlcApi.observationsGet({ projectId })
    setLoading(false)
    if (!result.ok) {
      if (isRequestCancelled(result.error)) return
      setError(result.error)
      return
    }
    setState(result.data)
    const hasEntries = hasObservationEntries(result.data.content)
    setOpen(hasEntries)
    setPreviewPath(hasEntries ? result.data.path : null)
  }, [projectId])

  const runPull = useCallback(async () => {
    setPulling(true)
    onPullBusyChangeRef.current?.(true)
    setError(null)
    try {
      const result = await window.aidlcApi.observationsPull({
        projectId,
        forceOwnRefresh: true
      })
      if (!result.ok) {
        if (isRequestCancelled(result.error)) return
        setError(result.error)
        return
      }
      setPull(result.data)

      const refreshed = await window.aidlcApi.observationsGet({ projectId })
      if (refreshed.ok) {
        setState(refreshed.data)
        if (hasObservationEntries(refreshed.data.content) && openRef.current) {
          setPreviewPath(refreshed.data.path)
        } else if (!openRef.current) {
          setPreviewPath(null)
        }
      }

      setInfo(`Actualizado (${result.data.files.length} archivo(s) de observaciones).`)
    } finally {
      setPulling(false)
      onPullBusyChangeRef.current?.(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadOwn()
  }, [loadOwn, refreshKey])

  useEffect(() => {
    if (pullKey < 1) return
    void runPull()
  }, [pullKey, runPull])

  async function onAppend(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (!note.trim() || saving) return
    setSaving(true)
    setError(null)
    setInfo(null)
    setOpen(true)
    const result = await window.aidlcApi.observationsAppend({
      projectId,
      text: note,
      relatedPath
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setState(result.data)
    setPreviewPath(result.data.path)
    setNote('')
    setPull(result.data.pull)
    setInfo(
      `Observacion agregada (borrador local). Tarea #${result.data.reviewTaskNumber} en aidlc-state.md (commit ${result.data.stateCommitId}). Pull: ${result.data.pulledFileCount} archivo(s).`
    )
  }

  async function onCloseDocument(): Promise<void> {
    if (closing) return
    setClosing(true)
    setError(null)
    setInfo(null)
    const result = await window.aidlcApi.observationsClose({ projectId })
    setClosing(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setOpen(false)
    setPreviewPath(null)
    setInfo(
      `Documento cerrado y publicado (${result.data.path}). Commit ${result.data.commitId}. Archivo nuevo${result.data.nextPath ? `: ${result.data.nextPath}` : ''}.`
    )
    const refreshed = await window.aidlcApi.observationsGet({ projectId })
    if (refreshed.ok) {
      setState(refreshed.data)
    }
    await runPull()
  }

  const previewContent =
    open && previewPath
      ? (previewPath === state?.path ? state.content : null) ||
        pull?.files.find((f) => f.path === previewPath)?.content ||
        null
      : null

  const showPreview = Boolean(open && previewContent && hasObservationEntries(previewContent))

  const others = pull?.files.filter((f) => !f.isOwn) ?? []
  const ownFiles = pull?.files.filter((f) => f.isOwn) ?? []

  return (
    <aside className="chat-panel observations-panel" data-testid="observations-panel">
      <div className="panel-title">Observaciones</div>
      <p className="muted chat-hint">
        Archivos en <code>aidlc-docs/inception/observations/</code>, numerados por documento (p.
        ej. <code>observations-nombre-apellido-1.md</code>). Al <strong>agregar</strong> se hace
        pull automatico y se registra una tarea en <code>aidlc-docs/aidlc-state.md</code> (INCEPTION
        PHASE). Al <strong>cerrar</strong> se publica el documento en <code>dev</code>, se oculta el
        preview y se abre un archivo nuevo. Usa <strong>Actualizar</strong> en la barra superior
        para traer cambios remotos.
      </p>

      {loading ? <p className="muted">Cargando…</p> : null}

      {state ? (
        <div className="obs-meta" data-testid="observations-meta">
          <div>
            <span className="muted">Autor:</span>{' '}
            <strong data-testid="observations-author">{state.displayName}</strong>
            <span className="muted"> ({state.authorSlug})</span>
          </div>
          <div className="muted obs-path" title={state.path}>
            {state.path}
          </div>
          <div className="muted">
            Estado:{' '}
            {open
              ? 'documento abierto (borrador local)'
              : 'documento cerrado — listo para una observacion nueva'}
          </div>
          {relatedPath ? (
            <div className="muted">
              Relativo al archivo abierto: <code>{relatedPath}</code>
            </div>
          ) : null}
          {pull ? (
            <div className="muted" data-testid="observations-pull-time">
              Ultima actualizacion: {new Date(pull.pulledAt).toLocaleString()}
            </div>
          ) : null}
        </div>
      ) : null}

      <form className="chat-form" onSubmit={(e) => void onAppend(e)}>
        <label className="muted" htmlFor="obs-note">
          Nueva observacion
        </label>
        <textarea
          id="obs-note"
          className="chat-input"
          data-testid="observations-input"
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Escribe tu observacion…"
          disabled={saving || loading || closing}
        />
        <div className="obs-actions">
          <button
            className="btn"
            type="submit"
            disabled={saving || loading || closing || pulling || !note.trim()}
            data-testid="observations-append-button"
          >
            {saving ? 'Guardando…' : 'Agregar observacion'}
          </button>
          <button
            className="btn"
            type="button"
            disabled={
              closing ||
              loading ||
              pulling ||
              !state ||
              !open ||
              !hasObservationEntries(state.content)
            }
            data-testid="observations-close-button"
            onClick={() => void onCloseDocument()}
          >
            {closing ? 'Publicando…' : 'Cerrar documento'}
          </button>
        </div>
      </form>

      {info ? (
        <p className="muted" data-testid="observations-info" style={{ marginTop: '0.65rem' }}>
          {info}
        </p>
      ) : null}
      {error ? (
        <div className="error" role="alert" data-testid="observations-error">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}

      {ownFiles.length > 0 || others.length > 0 ? (
        <div className="obs-others" data-testid="observations-files">
          <div className="panel-title">Archivos de observaciones</div>
          <ul className="obs-file-list">
            {ownFiles.map((f) => (
              <li key={f.path}>
                <button
                  type="button"
                  className={`tree-node${previewPath === f.path && open ? ' tree-node-selected' : ''}`}
                  onClick={() => {
                    if (!hasObservationEntries(f.content)) return
                    setOpen(true)
                    setPreviewPath(f.path)
                  }}
                >
                  {f.path.split('/').pop()} (mio)
                </button>
              </li>
            ))}
            {others.map((f) => (
              <li key={f.path}>
                <button
                  type="button"
                  className={`tree-node${previewPath === f.path && open ? ' tree-node-selected' : ''}`}
                  onClick={() => {
                    setOpen(true)
                    setPreviewPath(f.path)
                  }}
                >
                  {f.path.split('/').pop()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showPreview ? (
        <div className="obs-doc-block">
          <div className="panel-title">Preview</div>
          <div
            className="md-preview obs-preview"
            data-testid="observations-preview"
            dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(previewContent!) }}
          />
        </div>
      ) : (
        <p className="muted" data-testid="observations-preview-hidden" style={{ marginTop: '0.75rem' }}>
          {open
            ? 'Agrega una observacion para ver el preview.'
            : 'Documento cerrado. Agrega una observacion para abrir el archivo nuevo y ver el preview.'}
        </p>
      )}
    </aside>
  )
}
