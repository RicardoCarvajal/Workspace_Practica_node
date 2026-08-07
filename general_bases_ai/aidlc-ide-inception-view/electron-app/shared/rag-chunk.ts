import { DOCS_ROOT } from './path-guard'
import { isUnderObservationsDir } from './observations'
import { RAG_CHUNK_MAX_CHARS, RAG_CHUNK_OVERLAP } from './ai-config'

export interface TextChunk {
  id: string
  path: string
  chunkIndex: number
  text: string
}

/** True if path is aidlc-docs markdown eligible for RAG (excludes observations/). */
export function isRagIndexablePath(path: string): boolean {
  const n = path.replace(/\\/g, '/')
  if (n !== DOCS_ROOT && !n.startsWith(`${DOCS_ROOT}/`)) return false
  if (!n.toLowerCase().endsWith('.md')) return false
  if (isUnderObservationsDir(n)) return false
  return true
}

function splitLong(text: string, max: number, overlap: number): string[] {
  const t = text.trim()
  if (!t) return []
  if (t.length <= max) return [t]
  const parts: string[] = []
  let start = 0
  while (start < t.length) {
    const end = Math.min(start + max, t.length)
    parts.push(t.slice(start, end).trim())
    if (end >= t.length) break
    start = Math.max(0, end - overlap)
  }
  return parts.filter(Boolean)
}

/** Split markdown into chunks by ## headings, then size-cap. */
export function chunkMarkdown(path: string, content: string): TextChunk[] {
  const normalized = content.replace(/\r\n/g, '\n')
  const sections: string[] = []
  const headingSplit = normalized.split(/(?=^##\s+)/m)
  for (const section of headingSplit) {
    const s = section.trim()
    if (s) sections.push(s)
  }
  if (sections.length === 0 && normalized.trim()) {
    sections.push(normalized.trim())
  }

  const out: TextChunk[] = []
  let idx = 0
  for (const section of sections) {
    for (const piece of splitLong(section, RAG_CHUNK_MAX_CHARS, RAG_CHUNK_OVERLAP)) {
      out.push({
        id: `${path}#${idx}`,
        path,
        chunkIndex: idx,
        text: piece
      })
      idx += 1
    }
  }
  return out
}

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export function emptyTokenUsage(): TokenUsage {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
}

export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    totalTokens: a.totalTokens + b.totalTokens
  }
}

export function normalizeTokenUsage(raw: {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
}): TokenUsage {
  const inputTokens = Number(raw.inputTokens) || 0
  const outputTokens = Number(raw.outputTokens) || 0
  const totalTokens =
    Number(raw.totalTokens) || inputTokens + outputTokens
  return { inputTokens, outputTokens, totalTokens }
}
