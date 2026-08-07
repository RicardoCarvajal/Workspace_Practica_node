import { execFileSync } from 'child_process'
import { config as loadDotenv, parse as parseDotenv } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import type { AppSecrets, DevFlags } from '../../shared/runtime-config'
import { DEFAULT_AWS_REGION } from '../../shared/ai-config'

declare const __AIDLC_EMBEDDED_CONFIG_API_URL__: string | null | undefined
declare const __AIDLC_EMBEDDED_CONFIG__:
  | {
      baseUrl: string
      username: string
      password: string
      awsRegion?: string
      devMode?: boolean
      testRepoPath?: string | null
    }
  | null
  | undefined
declare const __AIDLC_EMBEDDED_AWS_REGION__: string | undefined

let cachedSecrets: AppSecrets | null | undefined
let cachedDev: DevFlags | undefined
let dotenvLoaded = false

/** Snapshot of OS/shell env before .env is applied (same names). */
let systemCreds: Partial<Record<CredentialKey, string | undefined>> = {}

/** AWS keys as present in the process before dotenv mutates process.env. */
let systemAwsEnv: Partial<Record<string, string | undefined>> = {}
let systemAwsCaptured = false

const CREDENTIAL_KEYS = ['GITLAB_USERNAME', 'GITLAB_PASSWORD'] as const
type CredentialKey = (typeof CREDENTIAL_KEYS)[number]

const AWS_ENV_KEYS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_REGION',
  'BEDROCK_MODEL_ID',
  'BEDROCK_EMBEDDING_MODEL_ID'
] as const

/** System AWS env captured before `.env` load (empty string if unset at launch). */
export function getSystemAwsEnv(name: string): string | undefined {
  captureSystemAwsEnv()
  const v = systemAwsEnv[name]
  if (v == null) return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

function captureSystemAwsEnv(): void {
  if (systemAwsCaptured) return
  for (const key of AWS_ENV_KEYS) {
    systemAwsEnv[key] = process.env[key]
  }
  systemAwsCaptured = true
}

function isPackagedApp(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron') as typeof import('electron')
    return Boolean(app?.isPackaged)
  } catch {
    return false
  }
}

function nonEmpty(value: string | undefined | null): string | undefined {
  if (value == null) return undefined
  const t = value.trim()
  return t === '' ? undefined : value
}

/** Locate .env even if Electron cwd is not the project root. */
export function findEnvFilePath(): string | null {
  const candidates = [
    join(process.cwd(), '.env'),
    join(dirname(__dirname), '../.env'),
    join(dirname(__dirname), '../../.env'),
    join(__dirname, '../../../.env')
  ]
  for (const p of candidates) {
    if (existsSync(p)) return p
  }
  return null
}

function readFromLoginShell(name: string): string | undefined {
  if (process.platform === 'win32') return undefined
  try {
    const out = execFileSync(
      'bash',
      ['-lc', `printf '%s' "\${${name}-}"`],
      {
        encoding: 'utf8',
        timeout: 4000,
        env: process.env,
        stdio: ['ignore', 'pipe', 'ignore']
      }
    )
    return nonEmpty(out)
  } catch {
    return undefined
  }
}

function resolveCredential(name: CredentialKey): string {
  const fromSystem = nonEmpty(systemCreds[name])
  if (fromSystem !== undefined) return fromSystem

  const fromProcess = nonEmpty(process.env[name])
  if (fromProcess !== undefined) return fromProcess

  const fromLogin = readFromLoginShell(name)
  if (fromLogin !== undefined) {
    process.env[name] = fromLogin
    return fromLogin
  }

  return ''
}

/** Inject compile-time API URL into process.env when not already set. */
export function applyEmbeddedConfigApiUrl(): void {
  try {
    const embedded = nonEmpty(__AIDLC_EMBEDDED_CONFIG_API_URL__)
    if (embedded && !nonEmpty(process.env.AIDLC_CONFIG_API_URL)) {
      process.env.AIDLC_CONFIG_API_URL = embedded.replace(/\/+$/, '')
    }
  } catch {
    /* define missing in unit tests */
  }
}

export function ensureDotenv(): void {
  applyEmbeddedConfigApiUrl()

  if (dotenvLoaded || isPackagedApp()) {
    captureSystemAwsEnv()
    return
  }

  captureSystemAwsEnv()

  systemCreds = {
    GITLAB_USERNAME: process.env.GITLAB_USERNAME,
    GITLAB_PASSWORD: process.env.GITLAB_PASSWORD
  }

  const envPath = findEnvFilePath()
  if (envPath) {
    loadDotenv({ path: envPath, override: false })
    try {
      const parsed = parseDotenv(readFileSync(envPath))
      for (const key of CREDENTIAL_KEYS) {
        const fileVal = nonEmpty(parsed[key])
        if (fileVal !== undefined && !nonEmpty(systemCreds[key])) {
          process.env[key] = fileVal
        }
      }
      const apiFromFile = nonEmpty(parsed.AIDLC_CONFIG_API_URL)
      if (apiFromFile && !nonEmpty(process.env.AIDLC_CONFIG_API_URL)) {
        process.env.AIDLC_CONFIG_API_URL = apiFromFile.replace(/\/+$/, '')
      }
    } catch {
      /* ignore */
    }
  }

  applyEmbeddedConfigApiUrl()
  dotenvLoaded = true
}

function parseBool(value: string | undefined): boolean {
  if (!value) return false
  const v = value.trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'yes' || v === 'on'
}

export function parseTestRepoPath(raw: string | undefined): string | null {
  if (!raw?.trim()) return null
  let s = raw.trim().replace(/\/+$/, '')
  try {
    if (/^https?:\/\//i.test(s)) {
      const u = new URL(s)
      s = u.pathname.replace(/^\/+/, '')
    }
  } catch {
    return null
  }
  s = s.replace(/^\/+/, '').replace(/\/+$/, '')
  return s || null
}

function readEmbeddedLegacy(): AppSecrets | null {
  try {
    const embedded = __AIDLC_EMBEDDED_CONFIG__
    if (embedded && embedded.baseUrl && embedded.username && embedded.password) {
      return {
        baseUrl: embedded.baseUrl.trim(),
        username: embedded.username.trim(),
        password: embedded.password,
        source: 'embedded'
      }
    }
  } catch {
    /* define missing */
  }
  return null
}

export function missingConfigKeys(): string[] {
  ensureDotenv()
  const missing: string[] = []
  if (!nonEmpty(process.env.AIDLC_CONFIG_API_URL)) {
    missing.push('AIDLC_CONFIG_API_URL')
  }
  return missing
}

function readSecretsFromProcessEnv(): AppSecrets | null {
  ensureDotenv()

  const baseUrl = (process.env.GITLAB_BASE_URL || '').trim()
  const username = resolveCredential('GITLAB_USERNAME').trim()
  const password = resolveCredential('GITLAB_PASSWORD')

  if (!baseUrl || !username || !password) return null

  return {
    baseUrl,
    username,
    password,
    source: 'env'
  }
}

/**
 * GitLab secrets: from process.env after Cognito/runtime config, or legacy bake.
 * Packaged builds no longer embed GitLab credentials.
 */
export function getAppSecrets(): AppSecrets | null {
  if (cachedSecrets !== undefined) return cachedSecrets

  cachedSecrets = readSecretsFromProcessEnv() ?? readEmbeddedLegacy()
  return cachedSecrets
}

/**
 * Dev flags from process.env (local .env or auth-api Secret after login).
 * No longer baked into the packaged binary.
 */
export function getDevFlags(): DevFlags {
  if (cachedDev !== undefined) return cachedDev

  ensureDotenv()

  let rawDev = process.env.AIDLC_DEV_MODE
  if (!isPackagedApp()) {
    const envPath = findEnvFilePath()
    if (envPath && existsSync(envPath)) {
      try {
        const parsed = parseDotenv(readFileSync(envPath))
        if (parsed.AIDLC_DEV_MODE !== undefined && String(parsed.AIDLC_DEV_MODE).trim() !== '') {
          rawDev = parsed.AIDLC_DEV_MODE
        }
      } catch {
        /* ignore */
      }
    }
  }

  const devMode = parseBool(rawDev)
  const fromUrl = parseTestRepoPath(process.env.AIDLC_TEST_REPO_URL)
  const fromPath = parseTestRepoPath(process.env.AIDLC_TEST_REPO_PATH)
  cachedDev = {
    devMode,
    testRepoPath: fromUrl ?? fromPath
  }
  return cachedDev
}

/**
 * AWS region: process.env (runtime Secret / .env), then default.
 * No longer required at compile time.
 */
export function getResolvedAwsRegion(): string {
  ensureDotenv()

  const fromEnv = nonEmpty(process.env.AWS_REGION)
  if (fromEnv) return fromEnv

  if (!isPackagedApp()) {
    const envPath = findEnvFilePath()
    if (envPath && existsSync(envPath)) {
      try {
        const parsed = parseDotenv(readFileSync(envPath))
        const fromFile = nonEmpty(parsed.AWS_REGION)
        if (fromFile) return fromFile
      } catch {
        /* ignore */
      }
    }
  }

  try {
    const fromDefine = nonEmpty(__AIDLC_EMBEDDED_AWS_REGION__)
    if (fromDefine) return fromDefine
  } catch {
    /* ignore */
  }

  try {
    const embedded = __AIDLC_EMBEDDED_CONFIG__
    const fromEmbed = nonEmpty(embedded?.awsRegion)
    if (fromEmbed) return fromEmbed
  } catch {
    /* ignore */
  }

  return DEFAULT_AWS_REGION
}

export function clearSecretsCache(): void {
  cachedSecrets = undefined
  cachedDev = undefined
  dotenvLoaded = false
  systemCreds = {}
}
