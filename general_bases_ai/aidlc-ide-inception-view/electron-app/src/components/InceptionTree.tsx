import { useCallback, useEffect, useState } from 'react'
import { isRequestCancelled } from '../../shared/errors'
import type { AppError, TreeNode } from '../../shared/types'

interface Props {
  nodes: TreeNode[]
  selectedPath: string | null
  onSelectFile: (path: string) => void
  onToggleDir: (path: string) => void
  expanded: Set<string>
  childrenByPath: Record<string, TreeNode[]>
  depth?: number
}

export default function InceptionTree({
  nodes,
  selectedPath,
  onSelectFile,
  onToggleDir,
  expanded,
  childrenByPath,
  depth = 0
}: Props): JSX.Element {
  return (
    <ul className="tree-list" style={{ paddingLeft: depth === 0 ? 0 : 12 }}>
      {nodes.map((node) => {
        const isOpen = expanded.has(node.path)
        const kids = childrenByPath[node.path]
        return (
          <li key={node.path}>
            {node.type === 'tree' ? (
              <>
                <button
                  type="button"
                  className="tree-node"
                  data-testid={`tree-dir-${node.path}`}
                  onClick={() => onToggleDir(node.path)}
                >
                  <span className="tree-icon">{isOpen ? 'v' : '>'}</span>
                  {node.name}/
                </button>
                {isOpen && kids ? (
                  <InceptionTree
                    nodes={kids}
                    selectedPath={selectedPath}
                    onSelectFile={onSelectFile}
                    onToggleDir={onToggleDir}
                    expanded={expanded}
                    childrenByPath={childrenByPath}
                    depth={depth + 1}
                  />
                ) : null}
              </>
            ) : (
              <button
                type="button"
                className={`tree-node${selectedPath === node.path ? ' tree-node-selected' : ''}`}
                data-testid={`tree-file-${node.path}`}
                onClick={() => onSelectFile(node.path)}
              >
                <span className="tree-icon">·</span>
                {node.name}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function useTreeLoader(projectId: number): {
  root: TreeNode[]
  expanded: Set<string>
  childrenByPath: Record<string, TreeNode[]>
  loading: boolean
  error: AppError | null
  toggleDir: (path: string) => Promise<void>
  collapseAll: () => void
  reloadRoot: () => Promise<void>
} {
  const [root, setRoot] = useState<TreeNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [childrenByPath, setChildrenByPath] = useState<Record<string, TreeNode[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  const reloadRoot = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await window.aidlcApi.listTree({ projectId })
    setLoading(false)
    if (!result.ok) {
      if (isRequestCancelled(result.error)) return
      setError(result.error)
      setRoot([])
      return
    }
    setRoot(result.data)
  }, [projectId])

  useEffect(() => {
    void reloadRoot()
  }, [reloadRoot])

  const toggleDir = useCallback(
    async (path: string) => {
      if (expanded.has(path)) {
        setExpanded((prev) => {
          const next = new Set(prev)
          next.delete(path)
          return next
        })
        return
      }
      setExpanded((prev) => new Set(prev).add(path))
      if (childrenByPath[path]) return
      const result = await window.aidlcApi.listTree({ projectId, path })
      if (!result.ok) {
        if (isRequestCancelled(result.error)) return
        setError(result.error)
        return
      }
      setChildrenByPath((prev) => ({ ...prev, [path]: result.data }))
    },
    [childrenByPath, expanded, projectId]
  )

  const collapseAll = useCallback(() => {
    setExpanded(new Set())
  }, [])

  return {
    root,
    expanded,
    childrenByPath,
    loading,
    error,
    toggleDir,
    collapseAll,
    reloadRoot
  }
}
