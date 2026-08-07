import { VALIDATION_ERROR } from './errors'
import type { AppError } from './types'

/** Full AI-DLC docs tree shown in the workspace browser and RAG index. */
export const DOCS_ROOT = 'aidlc-docs'

/** Inception phase subtree (observations still live here). */
export const INCEPTION_ROOT = 'aidlc-docs/inception'

/** Project-level AI-DLC state file (writable for observation review tasks). */
export const AIDLC_STATE_PATH = 'aidlc-docs/aidlc-state.md'

const TEXT_EXTENSIONS = new Set([
  '.md',
  '.txt',
  '.json',
  '.yml',
  '.yaml',
  '.xml',
  '.csv',
  '.toml',
  '.ini',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
  '.mdc',
  '.sh',
  '.env',
  '.gitignore',
  '.editorconfig'
])

export function normalizeRepoPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '')
}

function assertSafePath(path: string): string {
  const normalized = normalizeRepoPath(path)
  if (!normalized || normalized.includes('..') || normalized.includes('\0')) {
    throw VALIDATION_ERROR('Ruta de archivo invalida.')
  }
  return normalized
}

/** Ensures path is exactly docs root or a descendant. Throws AppError. */
export function assertUnderDocs(path: string): string {
  const normalized = assertSafePath(path)
  if (normalized !== DOCS_ROOT && !normalized.startsWith(`${DOCS_ROOT}/`)) {
    throw VALIDATION_ERROR('Solo se permiten rutas bajo aidlc-docs/.')
  }
  return normalized
}

/** Ensures path is exactly inception root or a descendant. Throws AppError. */
export function assertUnderInception(path: string): string {
  const normalized = assertSafePath(path)
  if (normalized !== INCEPTION_ROOT && !normalized.startsWith(`${INCEPTION_ROOT}/`)) {
    throw VALIDATION_ERROR('Solo se permiten rutas bajo aidlc-docs/inception/.')
  }
  return normalized
}

/**
 * Paths allowed for GitLab read/write from the app:
 * - anything under aidlc-docs/ (inception, construction, audit, state, etc.)
 */
export function assertAllowedRepoPath(path: string): string {
  return assertUnderDocs(path)
}

export function isMarkdownPath(path: string): boolean {
  return normalizeRepoPath(path).toLowerCase().endsWith('.md')
}

export function isPreviewableTextPath(path: string): boolean {
  const name = normalizeRepoPath(path).split('/').pop() ?? ''
  const lower = name.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot <= 0) {
    return ['readme', 'license', 'changelog', 'authors'].includes(lower)
  }
  return TEXT_EXTENSIONS.has(lower.slice(dot))
}

export function looksBinaryContent(content: string): boolean {
  return content.includes('\0')
}

export function asAppError(e: unknown): AppError | null {
  if (e && typeof e === 'object' && 'code' in e && 'message' in e) return e as AppError
  return null
}
