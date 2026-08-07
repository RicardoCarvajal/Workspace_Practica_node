import { useCallback, useRef, useState } from 'react'
import type { AppError, FileContent, SelectedProjectContext } from '../../shared/types'
import InceptionTree, { useTreeLoader } from '../components/InceptionTree'
import ObservationsPanel from '../components/ObservationsPanel'
import ChatAnalysisPanel from '../components/ChatAnalysisPanel'
import ResizableWorkspaceLayout from '../components/ResizableWorkspaceLayout'
import { renderMarkdownSafe } from '../lib/markdown'

interface Props {
  context: SelectedProjectContext
  onBack: () => void
}

export default function WorkspacePage({ context, onBack }: Props): JSX.Element {
  const tree = useTreeLoader(context.projectId)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [file, setFile] = useState<FileContent | null>(null)
  const [fileLoading, setFileLoading] = useState(false)
  const [fileError, setFileError] = useState<AppError | null>(null)
  const [pullKey, setPullKey] = useState(0)
  const [updating, setUpdating] = useState(false)
  const pullWaitRef = useRef<(() => void) | null>(null)

  const openFile = useCallback(
    async (path: string) => {
      setSelectedPath(path)
      setFileLoading(true)
      setFileError(null)
      const result = await window.aidlcApi.getFile({
        projectId: context.projectId,
        path
      })
      setFileLoading(false)
      if (!result.ok) {
        setFile(null)
        setFileError(result.error)
        return
      }
      setFile(result.data)
    },
    [context.projectId]
  )

  function closeFile(): void {
    setSelectedPath(null)
    setFile(null)
    setFileError(null)
  }

  async function handleActualizar(): Promise<void> {
    if (updating) return
    setUpdating(true)
    try {
      await tree.reloadRoot()
      if (selectedPath) {
        const result = await window.aidlcApi.getFile({
          projectId: context.projectId,
          path: selectedPath
        })
        if (result.ok) setFile(result.data)
      }
      await new Promise<void>((resolve) => {
        pullWaitRef.current = resolve
        setPullKey((k) => k + 1)
      })
    } finally {
      pullWaitRef.current = null
      setUpdating(false)
    }
  }

  const pageError = tree.error

  return (
    <main className="workspace" data-testid="workspace-page">
      <div className="workspace-toolbar">
        <div>
          <strong>{context.pathWithNamespace}</strong>
          <span className="muted"> · rama {context.branch}</span>
          <span className="muted" style={{ marginLeft: 8 }}>
            Documentos, chat IA y observaciones
          </span>
        </div>
        <div className="toolbar-actions">
          {selectedPath ? (
            <button
              className="btn btn-secondary"
              type="button"
              data-testid="close-file-button"
              onClick={closeFile}
            >
              Cerrar preview
            </button>
          ) : null}
          <button
            className="btn"
            type="button"
            disabled={updating || tree.loading}
            data-testid="workspace-refresh-button"
            onClick={() => void handleActualizar()}
          >
            {updating ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            className="btn"
            type="button"
            data-testid="back-to-repos-button"
            onClick={() => onBack()}
          >
            Volver a repositorios
          </button>
        </div>
      </div>

      {pageError ? (
        <div className="error" role="alert" data-testid="workspace-error">
          <strong>{pageError.title}</strong>
          <div>{pageError.message}</div>
        </div>
      ) : null}

      <ResizableWorkspaceLayout
        left={
          <aside className="tree-panel" data-testid="inception-tree-panel">
            <div className="tree-panel-header">
              <div className="panel-title">aidlc-docs/</div>
              <button
                className="btn btn-secondary"
                type="button"
                data-testid="tree-collapse-all"
                disabled={tree.expanded.size === 0}
                onClick={() => tree.collapseAll()}
                title="Colapsar todos los directorios"
              >
                Colapsar todo
              </button>
            </div>
            {tree.loading && tree.root.length === 0 ? (
              <p className="muted">Cargando arbol…</p>
            ) : null}
            {!pageError && tree.root.length === 0 && !tree.loading ? (
              <p className="muted">Carpeta vacia.</p>
            ) : null}
            <InceptionTree
              nodes={tree.root}
              selectedPath={selectedPath}
              onSelectFile={(p) => void openFile(p)}
              onToggleDir={(p) => void tree.toggleDir(p)}
              expanded={tree.expanded}
              childrenByPath={tree.childrenByPath}
            />
          </aside>
        }
        center={
          <section className="file-panel" data-testid="file-panel">
            {fileError ? (
              <div className="error" role="alert" data-testid="file-error">
                <strong>{fileError.title}</strong>
                <div>{fileError.message}</div>
                {selectedPath ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    style={{ marginTop: '0.65rem' }}
                    data-testid="close-file-error-button"
                    onClick={closeFile}
                  >
                    Cerrar preview
                  </button>
                ) : null}
              </div>
            ) : null}
            {!selectedPath ? (
              <p className="muted" data-testid="file-empty">
                Selecciona un archivo del arbol para verlo en preview.
              </p>
            ) : null}
            {fileLoading ? <p className="muted">Cargando archivo…</p> : null}
            {file && !fileLoading ? (
              <>
                <div className="file-tabs" role="tablist">
                  <span className="tab tab-active">Preview</span>
                  <span className="muted file-path">{file.path}</span>
                  <button
                    className="btn btn-secondary file-close-btn"
                    type="button"
                    data-testid="close-preview-panel-button"
                    aria-label="Cerrar preview"
                    title="Cerrar preview"
                    onClick={closeFile}
                  >
                    Cerrar
                  </button>
                </div>
                {file.isMarkdown ? (
                  <div
                    className="md-preview"
                    data-testid="markdown-preview"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownSafe(file.content) }}
                  />
                ) : (
                  <pre className="text-readonly" data-testid="text-readonly">
                    {file.content}
                  </pre>
                )}
              </>
            ) : null}
          </section>
        }
        right={
          <aside className="workspace-side-stack" data-testid="workspace-side-stack">
            <ChatAnalysisPanel
              projectId={context.projectId}
              openPath={selectedPath}
            />
            <ObservationsPanel
              projectId={context.projectId}
              relatedPath={selectedPath}
              pullKey={pullKey}
              onPullBusyChange={(busy) => {
                if (!busy) {
                  pullWaitRef.current?.()
                  pullWaitRef.current = null
                }
              }}
            />
          </aside>
        }
      />
    </main>
  )
}
