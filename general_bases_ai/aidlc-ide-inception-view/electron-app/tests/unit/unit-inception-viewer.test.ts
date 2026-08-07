import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  INCEPTION_ROOT,
  AIDLC_STATE_PATH,
  assertUnderInception,
  assertAllowedRepoPath,
  isMarkdownPath,
  isPreviewableTextPath
} from '../../shared/path-guard'
import { renderMarkdownSafe } from '../../src/lib/markdown'
import { parseTestRepoPath } from '../../electron/config/load-config'

describe('assertUnderInception', () => {
  it('allows inception root and children', () => {
    expect(assertUnderInception(INCEPTION_ROOT)).toBe(INCEPTION_ROOT)
    expect(assertUnderInception('aidlc-docs/inception/requirements/requirements.md')).toBe(
      'aidlc-docs/inception/requirements/requirements.md'
    )
  })

  it('rejects escapes and other roots', () => {
    expect(() => assertUnderInception('aidlc-docs/construction/x')).toThrow()
    expect(() => assertUnderInception('aidlc-docs/inception/../secrets')).toThrow()
    expect(() => assertUnderInception('/etc/passwd')).toThrow()
  })

  it('property: any path with .. is rejected', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), (suffix) => {
        const evil = `${INCEPTION_ROOT}/../${suffix.replace(/\0/g, '')}`
        expect(() => assertUnderInception(evil)).toThrow()
      })
    )
  })
})

describe('assertAllowedRepoPath', () => {
  it('allows any path under aidlc-docs/', () => {
    expect(assertAllowedRepoPath(AIDLC_STATE_PATH)).toBe(AIDLC_STATE_PATH)
    expect(assertAllowedRepoPath('aidlc-docs/inception/observations/a.md')).toBe(
      'aidlc-docs/inception/observations/a.md'
    )
    expect(assertAllowedRepoPath('aidlc-docs/audit.md')).toBe('aidlc-docs/audit.md')
    expect(assertAllowedRepoPath('aidlc-docs/construction/x')).toBe('aidlc-docs/construction/x')
  })

  it('rejects paths outside aidlc-docs/', () => {
    expect(() => assertAllowedRepoPath('src/App.tsx')).toThrow()
    expect(() => assertAllowedRepoPath('aidlc-docs/../secrets')).toThrow()
  })
})

describe('previewable paths', () => {
  it('detects markdown and text', () => {
    expect(isMarkdownPath('aidlc-docs/inception/a.md')).toBe(true)
    expect(isPreviewableTextPath('aidlc-docs/inception/a.md')).toBe(true)
    expect(isPreviewableTextPath('aidlc-docs/inception/a.png')).toBe(false)
  })
})

describe('renderMarkdownSafe', () => {
  it('escapes html and renders heading', () => {
    const html = renderMarkdownSafe('# Hola <script>')
    expect(html).toContain('<h1>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})

describe('parseTestRepoPath', () => {
  it('parses full GitLab URL to path_with_namespace', () => {
    expect(
      parseTestRepoPath(
        'https://git.intelix.biz/epa1/aplicaciones/ate/ate-poc-aidlc-ide-repo-test'
      )
    ).toBe('epa1/aplicaciones/ate/ate-poc-aidlc-ide-repo-test')
  })

  it('accepts raw path', () => {
    expect(parseTestRepoPath('epa1/aplicaciones/ate/ate-poc-aidlc-ide-repo-test')).toBe(
      'epa1/aplicaciones/ate/ate-poc-aidlc-ide-repo-test'
    )
  })
})
