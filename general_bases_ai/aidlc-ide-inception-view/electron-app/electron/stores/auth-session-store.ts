/** In-memory Cognito Access Token for the Main process only. */

export interface AuthSession {
  accessToken: string
  username: string
  expiresAt: number | null
}

let session: AuthSession | null = null

export function getAuthSession(): AuthSession | null {
  return session
}

export function hasAuthSession(): boolean {
  return Boolean(session?.accessToken)
}

export function setAuthSession(next: AuthSession): void {
  session = next
}

export function clearAuthSession(): void {
  session = null
}
