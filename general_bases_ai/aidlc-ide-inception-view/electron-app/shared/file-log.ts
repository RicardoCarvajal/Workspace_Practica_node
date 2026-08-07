/** Pure helpers for application file logging (FR-15). */

export const APP_LOG_MAX_BYTES = 400 * 1024
export const APP_LOG_FILE_NAME = 'app.log'
export const APP_LOG_DIR_NAME = 'logs'

export type AppLogLevel = 'info' | 'warn' | 'error'

const SENSITIVE_KEY =
  /pass(word)?|token|secret|authorization|api[_-]?key|credential|session/i

export function shouldTruncateLog(
  currentByteLength: number,
  maxBytes: number = APP_LOG_MAX_BYTES
): boolean {
  return currentByteLength >= maxBytes
}

/** Drop or redact values whose keys look like secrets. */
export function sanitizeLogMeta(
  meta: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!meta) return undefined
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = '[redacted]'
      continue
    }
    if (typeof value === 'string' && value.length > 500) {
      out[key] = `${value.slice(0, 500)}…`
      continue
    }
    out[key] = value
  }
  return out
}

export function formatAppLogLine(
  level: AppLogLevel,
  message: string,
  meta?: Record<string, unknown>,
  at: Date = new Date()
): string {
  const safeMeta = sanitizeLogMeta(meta)
  const base = `${at.toISOString()} [${level.toUpperCase()}] ${message.trim()}`
  if (!safeMeta || Object.keys(safeMeta).length === 0) {
    return `${base}\n`
  }
  let metaJson: string
  try {
    metaJson = JSON.stringify(safeMeta)
  } catch {
    metaJson = '{"error":"unserializable-meta"}'
  }
  return `${base} ${metaJson}\n`
}
