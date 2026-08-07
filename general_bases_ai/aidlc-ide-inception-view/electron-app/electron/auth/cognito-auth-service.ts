import { VALIDATION_ERROR } from '../../shared/errors'
import type { AidlcResult } from '../../shared/types'
import { clearAwsBedrockConfigCache } from '../config/aws-config'
import { clearSecretsCache } from '../config/load-config'
import { appLog } from '../services/app-logger'
import {
  clearAuthSession,
  getAuthSession,
  hasAuthSession,
  setAuthSession
} from '../stores/auth-session-store'
import {
  applyRuntimeConfigToProcessEnv,
  clearRuntimeConfig,
  isRuntimeConfigLoaded,
  setRuntimeConfig
} from '../stores/runtime-config-store'
import * as sessionStore from '../stores/session-store'
import * as authApi from './auth-api-client'
import {
  mapAuthHttpError,
  missingApiUrlError,
  sessionAlreadyActiveError
} from './auth-error-mapper'

export type CognitoAuthStatus = {
  authenticated: boolean
  configLoaded: boolean
  username?: string
  apiConfigured: boolean
}

export function getCognitoAuthStatus(): CognitoAuthStatus {
  const apiConfigured = Boolean(authApi.getConfigApiBaseUrl())
  return {
    authenticated: hasAuthSession(),
    configLoaded: isRuntimeConfigLoaded(),
    username: getAuthSession()?.username,
    apiConfigured
  }
}

function fullyAuthenticated(): boolean {
  return hasAuthSession() && isRuntimeConfigLoaded()
}

async function completeWithTokens(
  accessToken: string,
  username: string,
  expiresIn?: number
): Promise<AidlcResult<{ username: string }>> {
  try {
    const config = await authApi.fetchConfig(accessToken)
    setAuthSession({
      accessToken,
      username,
      expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null
    })
    setRuntimeConfig(config)
    applyRuntimeConfigToProcessEnv()
    clearSecretsCache()
    clearAwsBedrockConfigCache()
    appLog('info', 'Cognito auth + config loaded', { username })
    return { ok: true, data: { username } }
  } catch (e) {
    clearAuthSession()
    clearRuntimeConfig()
    const status =
      e instanceof authApi.AuthApiHttpError ? (e.status === 0 ? null : e.status) : null
    appLog('warn', 'Config session failed after login', { status })
    return { ok: false, error: mapAuthHttpError(status, 'config') }
  }
}

export type CognitoLoginIpcResult =
  | AidlcResult<{ username: string }>
  | {
      ok: true
      challenge: true
      data: { challenge: 'NEW_PASSWORD_REQUIRED'; session: string; username: string }
    }

export async function cognitoLogin(input: {
  username?: string
  password?: string
}): Promise<CognitoLoginIpcResult> {
  if (fullyAuthenticated()) {
    return { ok: false, error: sessionAlreadyActiveError() }
  }
  if (!authApi.getConfigApiBaseUrl()) {
    return { ok: false, error: missingApiUrlError() }
  }

  const username = String(input.username ?? '').trim()
  const password = String(input.password ?? '')
  if (!username || !password) {
    return {
      ok: false,
      error: VALIDATION_ERROR('Usuario y contrasena son obligatorios.')
    }
  }

  try {
    const result = await authApi.login(username, password)
    if (result.kind === 'challenge') {
      appLog('info', 'Cognito NEW_PASSWORD_REQUIRED challenge')
      return {
        ok: true,
        challenge: true,
        data: {
          challenge: 'NEW_PASSWORD_REQUIRED',
          session: result.session,
          username: result.username
        }
      }
    }
    return completeWithTokens(result.accessToken, username, result.expiresIn)
  } catch (e) {
    const status =
      e instanceof authApi.AuthApiHttpError
        ? e.status === 0
          ? null
          : e.status
        : null
    appLog('warn', 'Cognito login failed', { status })
    return { ok: false, error: mapAuthHttpError(status, 'login') }
  }
}

export async function cognitoRespondNewPassword(input: {
  username?: string
  session?: string
  newPassword?: string
}): Promise<AidlcResult<{ username: string }>> {
  if (fullyAuthenticated()) {
    return { ok: false, error: sessionAlreadyActiveError() }
  }
  if (!authApi.getConfigApiBaseUrl()) {
    return { ok: false, error: missingApiUrlError() }
  }

  const username = String(input.username ?? '').trim()
  const session = String(input.session ?? '')
  const newPassword = String(input.newPassword ?? '')
  if (!username || !session || !newPassword) {
    return {
      ok: false,
      error: VALIDATION_ERROR('Completa la nueva contrasena.')
    }
  }

  try {
    const result = await authApi.respondNewPassword({
      username,
      session,
      newPassword
    })
    return completeWithTokens(result.accessToken, username, result.expiresIn)
  } catch (e) {
    const status =
      e instanceof authApi.AuthApiHttpError
        ? e.status === 0
          ? null
          : e.status
        : null
    appLog('warn', 'Cognito new password failed', { status })
    return { ok: false, error: mapAuthHttpError(status, 'newPassword') }
  }
}

export function cognitoLogout(): void {
  clearAuthSession()
  clearRuntimeConfig()
  clearSecretsCache()
  clearAwsBedrockConfigCache()
  sessionStore.clearSession()
  appLog('info', 'Cognito session cleared')
}
