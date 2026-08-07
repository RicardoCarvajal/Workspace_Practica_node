import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { homedir } from 'os'
import { dirname, join } from 'path'
import {
  validateAwsLocalCredentials,
  type AwsLocalCredentials
} from '../../shared/aws-local-credentials'
import { findEnvFilePath } from '../config/load-config'

const CREDENTIALS_FILENAME = 'aws-credentials.json'
const APP_DIR_NAME = 'aidlc-ide-inception-view'

/**
 * Writable directory for aws-credentials.json:
 * - Dev/project: project root (where `.env` lives)
 * - Packaged: ~/aidlc-ide-inception-view/
 */
export function resolveAwsCredentialsDir(): string {
  const envPath = findEnvFilePath()
  if (envPath) return dirname(envPath)

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { app } = require('electron') as typeof import('electron')
    if (!app.isPackaged) {
      const cwd = process.cwd()
      if (existsSync(join(cwd, 'package.json'))) return cwd
    }
  } catch {
    /* app may be unavailable in some tests */
  }

  return join(homedir(), APP_DIR_NAME)
}

export function awsCredentialsFilePath(): string {
  return join(resolveAwsCredentialsDir(), CREDENTIALS_FILENAME)
}

export function loadAwsLocalCredentials(): AwsLocalCredentials | null {
  const file = awsCredentialsFilePath()
  try {
    if (!existsSync(file)) return null
    const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    const validated = validateAwsLocalCredentials({
      accessKeyId: String(raw.accessKeyId ?? raw.AWS_ACCESS_KEY_ID ?? ''),
      secretAccessKey: String(raw.secretAccessKey ?? raw.AWS_SECRET_ACCESS_KEY ?? '')
    })
    return validated.ok ? validated.data : null
  } catch {
    return null
  }
}

export function saveAwsLocalCredentials(input: {
  accessKeyId: string
  secretAccessKey: string
}): { ok: true; data: AwsLocalCredentials } | { ok: false; message: string } {
  const validated = validateAwsLocalCredentials(input)
  if (!validated.ok) return validated

  const dir = resolveAwsCredentialsDir()
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    awsCredentialsFilePath(),
    JSON.stringify(
      {
        accessKeyId: validated.data.accessKeyId,
        secretAccessKey: validated.data.secretAccessKey,
        savedAt: new Date().toISOString()
      },
      null,
      2
    ),
    'utf8'
  )
  return { ok: true, data: validated.data }
}

export function hasAwsLocalCredentials(): boolean {
  return loadAwsLocalCredentials() !== null
}
