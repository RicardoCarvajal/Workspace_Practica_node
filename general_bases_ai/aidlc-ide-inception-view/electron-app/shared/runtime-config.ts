/** Secrets available only in Main. Never expose password to Renderer. */
export interface AppSecrets {
  baseUrl: string
  username: string
  password: string
  /** embedded = baked at compile time; env = local .env */
  source: 'embedded' | 'env'
}

/** Dev flags: local `.env` in development; from auth-api Secret after Cognito in packaged builds. */
export interface DevFlags {
  /** When true, app runs in development mode (filtered test repo, etc.). */
  devMode: boolean
  /**
   * path_with_namespace of the repo to show in dev mode
   * (parsed from AIDLC_TEST_REPO_URL or AIDLC_TEST_REPO_PATH).
   */
  testRepoPath: string | null
}

/** Public bootstrap info safe for Renderer (no secrets). */
export interface BootstrapInfo {
  credentialsSource: 'embedded' | 'env' | 'none'
  /** When true, UI must not show URL/user/password fields. */
  credentialsLocked: boolean
  authenticated: boolean
  username?: string
  baseUrlLabel?: string
  /** True when AIDLC_DEV_MODE=true in local .env */
  devMode: boolean
  testRepoPath?: string | null
  /** Local profile (nombre/apellido) for header and observation files. */
  profile?: import('./user-profile').UserProfile | null
  displayName?: string | null
  /** AIDLC_DEV_MODE=false → ask and store local aws-credentials.json */
  awsPromptMode?: boolean
  awsCredentialsConfigured?: boolean
  error?: import('./types').AppError
}
