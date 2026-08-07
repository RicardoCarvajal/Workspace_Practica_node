/** Injected by electron-vite `define` at compile time (main process only). */

/** Auth-api HTTP base URL baked at compile time (from AIDLC_CONFIG_API_URL). */
declare const __AIDLC_EMBEDDED_CONFIG_API_URL__: string | null | undefined

/**
 * @deprecated GitLab secrets are no longer baked; always null.
 * Kept for compile compatibility during migration.
 */
declare const __AIDLC_EMBEDDED_CONFIG__:
  | {
      baseUrl: string
      username: string
      password: string
      devMode?: boolean
      testRepoPath?: string | null
      testRepoUrl?: string | null
      awsRegion?: string
    }
  | null
  | undefined

/**
 * @deprecated AWS region comes from auth-api Secret after login.
 * Kept for compile compatibility during migration.
 */
declare const __AIDLC_EMBEDDED_AWS_REGION__: string | undefined

export {}
