import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { RememberedLoginHint } from '../../shared/types'

const FILE_NAME = 'remembered-login.json'

function filePath(): string {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return join(dir, FILE_NAME)
}

export function loadRememberedLogin(): RememberedLoginHint | null {
  try {
    const raw = readFileSync(filePath(), 'utf8')
    const parsed = JSON.parse(raw) as RememberedLoginHint
    if (!parsed?.baseUrl || !parsed?.username) return null
    // Never allow password field even if someone tampered the file
    return { baseUrl: parsed.baseUrl, username: parsed.username }
  } catch {
    return null
  }
}

export function saveRememberedLogin(hint: RememberedLoginHint): void {
  const safe: RememberedLoginHint = {
    baseUrl: hint.baseUrl,
    username: hint.username
  }
  writeFileSync(filePath(), JSON.stringify(safe, null, 2), 'utf8')
}

/** Pure helper for tests: strip any accidental password key */
export function sanitizeRememberedHint(input: Record<string, unknown>): RememberedLoginHint {
  return {
    baseUrl: String(input.baseUrl ?? ''),
    username: String(input.username ?? '')
  }
}
