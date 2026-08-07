import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode
} from 'react'

const STORAGE_KEY = 'aidlc.workspace.panelWidths'
const DEFAULT_LEFT = 220
const DEFAULT_RIGHT = 360
const MIN_LEFT = 160
const MIN_RIGHT = 280
const MIN_CENTER = 220

interface StoredWidths {
  left: number
  right: number
}

function loadWidths(): StoredWidths {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT }
    const parsed = JSON.parse(raw) as StoredWidths
    return {
      left: Number.isFinite(parsed.left) ? parsed.left : DEFAULT_LEFT,
      right: Number.isFinite(parsed.right) ? parsed.right : DEFAULT_RIGHT
    }
  } catch {
    return { left: DEFAULT_LEFT, right: DEFAULT_RIGHT }
  }
}

interface Props {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

/**
 * Three-column workspace with draggable vertical separators
 * (explorer | preview | chat/observations).
 */
export default function ResizableWorkspaceLayout({
  left,
  center,
  right
}: Props): JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const [widths, setWidths] = useState<StoredWidths>(() => loadWidths())
  const [resizing, setResizing] = useState(false)
  const dragRef = useRef<{
    which: 'left' | 'right'
    startX: number
    startLeft: number
    startRight: number
  } | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widths))
  }, [widths])

  const clamp = useCallback((leftW: number, rightW: number): StoredWidths => {
    const total = rootRef.current?.clientWidth ?? 1200
    const handleSpace = 12
    let l = Math.max(MIN_LEFT, leftW)
    let r = Math.max(MIN_RIGHT, rightW)
    const maxSide = Math.max(MIN_LEFT, total - handleSpace - MIN_CENTER)
    if (l + r > maxSide) {
      const overflow = l + r - maxSide
      if (l >= r) l = Math.max(MIN_LEFT, l - overflow)
      else r = Math.max(MIN_RIGHT, r - overflow)
    }
    return { left: Math.round(l), right: Math.round(r) }
  }, [])

  const onPointerDown = useCallback(
    (which: 'left' | 'right', e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = {
        which,
        startX: e.clientX,
        startLeft: widths.left,
        startRight: widths.right
      }
      setResizing(true)
    },
    [widths]
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current
      if (!drag) return
      const dx = e.clientX - drag.startX
      if (drag.which === 'left') {
        setWidths(clamp(drag.startLeft + dx, drag.startRight))
      } else {
        setWidths(clamp(drag.startLeft, drag.startRight - dx))
      }
    },
    [clamp]
  )

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    setResizing(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div
      className={`workspace-layout workspace-layout-resizable${resizing ? ' is-resizing' : ''}`}
      data-testid="resizable-workspace"
      ref={rootRef}
    >
      <div
        className="workspace-pane workspace-pane-left"
        style={{ width: widths.left, flex: `0 0 ${widths.left}px` }}
      >
        {left}
      </div>
      <div
        className="split-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar explorador y preview"
        data-testid="split-handle-left"
        onPointerDown={(e) => onPointerDown('left', e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="workspace-pane workspace-pane-center">{center}</div>
      <div
        className="split-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar preview y chat"
        data-testid="split-handle-right"
        onPointerDown={(e) => onPointerDown('right', e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div
        className="workspace-pane workspace-pane-right"
        style={{ width: widths.right, flex: `0 0 ${widths.right}px` }}
      >
        {right}
      </div>
    </div>
  )
}
