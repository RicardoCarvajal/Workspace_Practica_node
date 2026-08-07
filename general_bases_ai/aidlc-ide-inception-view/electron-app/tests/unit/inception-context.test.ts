import { describe, expect, it } from 'vitest'
import {
  extractFileIndexEntry,
  formatIndexText,
  scoreFileForQuery,
  selectRelevantPaths,
  truncateText
} from '../../electron/services/inception-context'

describe('inception-context', () => {
  it('extracts title, headings and HU ids', () => {
    const entry = extractFileIndexEntry(
      'aidlc-docs/inception/user-stories/principales.md',
      [
        '# Historias principales',
        '',
        '## HU-01 Login',
        'Como usuario quiero entrar.',
        '',
        '### Criterios',
        'Relacionada con US-02'
      ].join('\n')
    )
    expect(entry.title).toBe('Historias principales')
    expect(entry.ids).toContain('HU-01')
    expect(entry.ids).toContain('US-02')
    expect(entry.headings.some((h) => /HU-01/i.test(h))).toBe(true)
  })

  it('scores brecha/HU queries higher for matching paths', () => {
    const main = extractFileIndexEntry(
      'aidlc-docs/inception/user-stories/principales.md',
      '# Principales\n\n## HU-01'
    )
    const gap = extractFileIndexEntry(
      'aidlc-docs/inception/user-stories/brecha.md',
      '# Brecha\n\n## HU-10 Cierra gap de login'
    )
    const q = 'Dime si hay HU que se relacionan entre la HU principales y la de brecha'
    expect(scoreFileForQuery(gap, q)).toBeGreaterThan(scoreFileForQuery(main, q) - 2)
    const selected = selectRelevantPaths([main, gap], q, null, 3)
    expect(selected).toContain(gap.path)
    expect(selected).toContain(main.path)
  })

  it('truncates long text with marker', () => {
    expect(truncateText('abcdef', 4)).toContain('truncado')
    expect(truncateText('abc', 10)).toBe('abc')
  })

  it('keeps index under budget', () => {
    const entries = Array.from({ length: 5 }, (_, i) =>
      extractFileIndexEntry(`aidlc-docs/inception/f${i}.md`, `# File ${i}\n\n## Seccion\ntexto`)
    )
    const text = formatIndexText(entries)
    expect(text).toContain('INDICE COMPACTO')
    expect(text).toContain('aidlc-docs/inception/f0.md')
  })
})
