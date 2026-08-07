import { appendFileSync, existsSync, mkdirSync, statSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  APP_LOG_DIR_NAME,
  APP_LOG_FILE_NAME,
  APP_LOG_MAX_BYTES,
  type AppLogLevel,
  formatAppLogLine,
  shouldTruncateLog
} from '../../shared/file-log'

let logsDir: string | null = null
let logFilePath: string | null = null
let ready = false

function resolveLogsDir(): string {
  return join(process.cwd(), APP_LOG_DIR_NAME)
}

export function getAppLogPath(): string | null {
  return logFilePath
}

/** Create `logs/` under project cwd and prepare `app.log`. */
export function initAppLogger(): void {
  try {
    logsDir = resolveLogsDir()
    mkdirSync(logsDir, { recursive: true })
    logFilePath = join(logsDir, APP_LOG_FILE_NAME)
    if (!existsSync(logFilePath)) {
      writeFileSync(logFilePath, '', 'utf8')
    }
    ready = true
    appLog('info', 'App logger initialized', { path: logFilePath, maxBytes: APP_LOG_MAX_BYTES })
  } catch (err) {
    ready = false
    logsDir = null
    logFilePath = null
    console.error('[app-logger] Failed to init logs directory', err)
  }
}

function truncateIfNeeded(file: string): void {
  try {
    const size = existsSync(file) ? statSync(file).size : 0
    if (shouldTruncateLog(size)) {
      writeFileSync(file, '', 'utf8')
    }
  } catch {
    /* best effort */
  }
}

export function appLog(
  level: AppLogLevel,
  message: string,
  meta?: Record<string, unknown>
): void {
  const line = formatAppLogLine(level, message, meta)
  if (!ready || !logFilePath) {
    if (level === 'error') console.error(line.trimEnd())
    else if (level === 'warn') console.warn(line.trimEnd())
    else console.log(line.trimEnd())
    return
  }
  try {
    truncateIfNeeded(logFilePath)
    appendFileSync(logFilePath, line, 'utf8')
  } catch (err) {
    console.error('[app-logger] Write failed', err)
  }
}
