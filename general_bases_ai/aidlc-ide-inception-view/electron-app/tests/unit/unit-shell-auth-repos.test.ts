import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { mapProject, normalizeBaseUrl } from '../../electron/services/gitlab-api-client'
import { sanitizeRememberedHint } from '../../electron/stores/remembered-login-store'

describe('mapProject', () => {
  it('maps GitLab project JSON to RepoSummary', () => {
    expect(
      mapProject({
        id: 7,
        name: 'demo',
        path_with_namespace: 'group/demo',
        description: null
      })
    ).toEqual({
      id: 7,
      name: 'demo',
      pathWithNamespace: 'group/demo',
      description: undefined
    })
  })
})

describe('normalizeBaseUrl', () => {
  it('accepts https URLs and strips trailing slash', () => {
    expect(normalizeBaseUrl('https://git.intelix.biz/')).toBe('https://git.intelix.biz')
  })

  it('rejects non-https', () => {
    expect(() => normalizeBaseUrl('http://git.intelix.biz')).toThrow()
  })
})

describe('LOGIN_FAILED message', () => {
  it('mentions Personal Access Token for GitLab API', async () => {
    const { LOGIN_FAILED } = await import('../../shared/errors')
    expect(LOGIN_FAILED().message.toLowerCase()).toContain('token')
  })
})

describe('sanitizeRememberedHint', () => {
  it('never keeps a password field (P-AUTH-2)', () => {
    fc.assert(
      fc.property(
        fc.record({
          baseUrl: fc.webUrl({ validSchemes: ['https'] }),
          username: fc.string({ minLength: 1, maxLength: 40 }),
          password: fc.string()
        }),
        (input) => {
          const hint = sanitizeRememberedHint(input)
          expect(hint).toEqual({
            baseUrl: String(input.baseUrl),
            username: String(input.username)
          })
          expect(Object.keys(hint).sort()).toEqual(['baseUrl', 'username'])
        }
      )
    )
  })
})
