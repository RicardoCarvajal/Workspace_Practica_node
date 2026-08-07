import { describe, expect, it } from 'vitest'
import {
  addTokenUsage,
  chunkMarkdown,
  emptyTokenUsage,
  isRagIndexablePath,
  normalizeTokenUsage
} from '../../shared/rag-chunk'

describe('rag chunking', () => {
  it('indexes aidlc-docs md but not observations dirs', () => {
    expect(isRagIndexablePath('aidlc-docs/inception/requirements/requirements.md')).toBe(true)
    expect(
      isRagIndexablePath('aidlc-docs/inception/observations/observations-juan-perez.md')
    ).toBe(false)
    expect(
      isRagIndexablePath('aidlc-docs/inception/observaciones/observaciones-juan-perez.md')
    ).toBe(false)
    expect(isRagIndexablePath('aidlc-docs/construction/x.md')).toBe(true)
    expect(isRagIndexablePath('aidlc-docs/audit.md')).toBe(true)
  })

  it('splits by headings and enumerates chunks', () => {
    const chunks = chunkMarkdown(
      'aidlc-docs/inception/x.md',
      '# Title\n\n## Uno\n\ntexto uno\n\n## Dos\n\ntexto dos'
    )
    expect(chunks.length).toBeGreaterThanOrEqual(2)
    expect(chunks[0]?.chunkIndex).toBe(0)
    expect(chunks.some((c) => c.text.includes('Uno'))).toBe(true)
  })

  it('accumulates token usage', () => {
    const a = normalizeTokenUsage({ inputTokens: 10, outputTokens: 5, totalTokens: 15 })
    const b = emptyTokenUsage()
    expect(addTokenUsage(a, b).totalTokens).toBe(15)
    expect(addTokenUsage(a, a).inputTokens).toBe(20)
  })
})
