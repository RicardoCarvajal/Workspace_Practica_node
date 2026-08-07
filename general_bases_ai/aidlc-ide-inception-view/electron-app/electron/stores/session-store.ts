import type { GitLabAuthMode, Session } from '../../shared/types'

let session: Session | null = null

export function getSession(): Session | null {
  return session
}

export function setSession(next: Session): void {
  session = { ...next }
}

export function clearSession(): void {
  session = null
}

export function isAuthenticated(): boolean {
  return Boolean(session?.isAuthenticated && session.password)
}

export function getAuthMode(): GitLabAuthMode | null {
  return session?.authMode ?? null
}

/** Authorization headers for GitLab REST (Basic or PRIVATE-TOKEN). */
export function getAuthHeaders(): Record<string, string> | null {
  if (!session?.isAuthenticated || !session.password) return null
  if (session.authMode === 'private_token') {
    return {
      'PRIVATE-TOKEN': session.password,
      Accept: 'application/json'
    }
  }
  const token = Buffer.from(`${session.username}:${session.password}`, 'utf8').toString('base64')
  return {
    Authorization: `Basic ${token}`,
    Accept: 'application/json'
  }
}

/** @deprecated Prefer getAuthHeaders — kept for callers that still expect Basic. */
export function getBasicAuthHeader(): string | null {
  const headers = getAuthHeaders()
  return headers?.Authorization ?? null
}

export function getBaseUrl(): string | null {
  return session?.baseUrl ?? null
}
