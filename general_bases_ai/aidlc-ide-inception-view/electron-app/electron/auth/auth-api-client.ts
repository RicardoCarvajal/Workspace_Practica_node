import { ensureDotenv } from '../config/load-config'

const DEFAULT_TIMEOUT_MS = 15_000

export type AuthLoginSuccess = {
  kind: 'tokens'
  accessToken: string
  expiresIn?: number
}

export type AuthLoginChallenge = {
  kind: 'challenge'
  challenge: 'NEW_PASSWORD_REQUIRED'
  session: string
  username: string
}

export type AuthLoginResult = AuthLoginSuccess | AuthLoginChallenge

export class AuthApiHttpError extends Error {
  constructor(
    readonly status: number,
    message?: string
  ) {
    super(message ?? `HTTP ${status}`)
    this.name = 'AuthApiHttpError'
  }
}

function resolveBaseUrl(): string {
  ensureDotenv()
  return (process.env.AIDLC_CONFIG_API_URL || '').trim().replace(/\/+$/, '')
}

export function getConfigApiBaseUrl(): string {
  return resolveBaseUrl()
}

async function postJson(
  path: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<{ status: number; text: string }> {
  const base = resolveBaseUrl()
  if (!base) {
    throw new AuthApiHttpError(0, 'missing_base_url')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body ?? {}),
      signal: controller.signal
    })
    const text = await res.text()
    return { status: res.status, text }
  } finally {
    clearTimeout(timer)
  }
}

export async function login(username: string, password: string): Promise<AuthLoginResult> {
  let status: number
  let text: string
  try {
    ;({ status, text } = await postJson('/auth/login', { username, password }))
  } catch (e) {
    if (e instanceof AuthApiHttpError) throw e
    throw new AuthApiHttpError(0, 'network')
  }

  if (status < 200 || status >= 300) {
    throw new AuthApiHttpError(status)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new AuthApiHttpError(500)
  }

  if (data.challenge === 'NEW_PASSWORD_REQUIRED') {
    return {
      kind: 'challenge',
      challenge: 'NEW_PASSWORD_REQUIRED',
      session: String(data.session ?? ''),
      username: String(data.username ?? username)
    }
  }

  const accessToken = String(data.accessToken ?? '')
  if (!accessToken) {
    throw new AuthApiHttpError(500)
  }
  return {
    kind: 'tokens',
    accessToken,
    expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : undefined
  }
}

export async function respondNewPassword(input: {
  username: string
  session: string
  newPassword: string
}): Promise<AuthLoginSuccess> {
  let status: number
  let text: string
  try {
    ;({ status, text } = await postJson('/auth/respond-new-password', input))
  } catch (e) {
    if (e instanceof AuthApiHttpError) throw e
    throw new AuthApiHttpError(0, 'network')
  }

  if (status < 200 || status >= 300) {
    throw new AuthApiHttpError(status)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new AuthApiHttpError(500)
  }

  const accessToken = String(data.accessToken ?? '')
  if (!accessToken) {
    throw new AuthApiHttpError(500)
  }
  return {
    kind: 'tokens',
    accessToken,
    expiresIn: typeof data.expiresIn === 'number' ? data.expiresIn : undefined
  }
}

export async function fetchConfig(accessToken: string): Promise<Record<string, unknown>> {
  let status: number
  let text: string
  try {
    ;({ status, text } = await postJson(
      '/config/session',
      {},
      { Authorization: `Bearer ${accessToken}` }
    ))
  } catch (e) {
    if (e instanceof AuthApiHttpError) throw e
    throw new AuthApiHttpError(0, 'network')
  }

  if (status < 200 || status >= 300) {
    throw new AuthApiHttpError(status)
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(text) as Record<string, unknown>
  } catch {
    throw new AuthApiHttpError(500)
  }

  const config = data.config
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new AuthApiHttpError(404)
  }
  return config as Record<string, unknown>
}
