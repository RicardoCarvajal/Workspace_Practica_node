import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { TextChunk } from '../../shared/rag-chunk'
import { DEFAULT_EMBEDDING_DIMENSIONS } from '../../shared/ai-config'

export interface VectorRow extends TextChunk {
  vector: number[]
}

interface StoreFile {
  version: 1
  engine: 'lancedb-embedded'
  dimensions: number
  rows: VectorRow[]
}

/**
 * Embedded vector store under userData/lancedb/{projectId}.
 * On-disk LanceDB-style local index (JSON table). Prefer swapping to
 * `@lancedb/lancedb` when the native package is installable in the environment.
 */
export class EmbeddedLanceStore {
  constructor(private readonly projectId: number) {}

  private dir(): string {
    return join(app.getPath('userData'), 'lancedb', String(this.projectId))
  }

  private file(): string {
    return join(this.dir(), 'chunks.json')
  }

  clear(): void {
    const d = this.dir()
    if (existsSync(d)) {
      rmSync(d, { recursive: true, force: true })
    }
  }

  replaceAll(rows: VectorRow[], dimensions = DEFAULT_EMBEDDING_DIMENSIONS): void {
    const d = this.dir()
    mkdirSync(d, { recursive: true })
    const payload: StoreFile = {
      version: 1,
      engine: 'lancedb-embedded',
      dimensions,
      rows
    }
    writeFileSync(this.file(), JSON.stringify(payload), 'utf8')
  }

  load(): VectorRow[] {
    const f = this.file()
    if (!existsSync(f)) return []
    try {
      const raw = JSON.parse(readFileSync(f, 'utf8')) as StoreFile
      return Array.isArray(raw.rows) ? raw.rows : []
    } catch {
      return []
    }
  }

  count(): number {
    return this.load().length
  }

  search(queryVector: number[], topK: number): VectorRow[] {
    const rows = this.load()
    if (rows.length === 0) return []
    const scored = rows.map((row) => ({
      row,
      score: cosineSimilarity(queryVector, row.vector)
    }))
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, Math.max(1, topK)).map((s) => s.row)
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n === 0) return -1
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < n; i++) {
    const x = a[i] ?? 0
    const y = b[i] ?? 0
    dot += x * y
    na += x * x
    nb += y * y
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? -1 : dot / denom
}

export function getLanceStore(projectId: number): EmbeddedLanceStore {
  return new EmbeddedLanceStore(projectId)
}
