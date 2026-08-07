import { afterEach, describe, expect, it } from 'vitest'
import {
  applyRuntimeConfigToProcessEnv,
  clearRuntimeConfig,
  getRuntimeConfigValue,
  isRuntimeConfigLoaded,
  setRuntimeConfig
} from '../../electron/stores/runtime-config-store'
import {
  clearAuthSession,
  hasAuthSession,
  setAuthSession
} from '../../electron/stores/auth-session-store'
import { mapAuthHttpError, sessionAlreadyActiveError } from '../../electron/auth/auth-error-mapper'

describe('runtime-config-store', () => {
  afterEach(() => {
    clearRuntimeConfig()
    delete process.env.AWS_REGION
  })

  it('loads and clears config in memory', () => {
    expect(isRuntimeConfigLoaded()).toBe(false)
    setRuntimeConfig({ AWS_REGION: 'us-east-1', GITLAB_BASE_URL: 'https://git.example' })
    expect(isRuntimeConfigLoaded()).toBe(true)
    expect(getRuntimeConfigValue('AWS_REGION')).toBe('us-east-1')
    applyRuntimeConfigToProcessEnv()
    expect(process.env.AWS_REGION).toBe('us-east-1')
    clearRuntimeConfig()
    expect(isRuntimeConfigLoaded()).toBe(false)
  })
})

describe('auth-session-store', () => {
  afterEach(() => {
    clearAuthSession()
  })

  it('tracks access token session', () => {
    expect(hasAuthSession()).toBe(false)
    setAuthSession({ accessToken: 'tok', username: 'alice', expiresAt: null })
    expect(hasAuthSession()).toBe(true)
    clearAuthSession()
    expect(hasAuthSession()).toBe(false)
  })
})

describe('auth-error-mapper', () => {
  it('maps login 401 to Spanish credentials message', () => {
    const err = mapAuthHttpError(401, 'login')
    expect(err.message).toMatch(/Credenciales invalidas/i)
  })

  it('maps config 404', () => {
    const err = mapAuthHttpError(404, 'config')
    expect(err.message).toMatch(/configuracion/i)
  })

  it('session already active message', () => {
    expect(sessionAlreadyActiveError().message).toMatch(/Cierra sesion/i)
  })
})
