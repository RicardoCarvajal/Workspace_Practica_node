import { describe, expect, it } from 'vitest'
import {
  APP_LOG_MAX_BYTES,
  formatAppLogLine,
  sanitizeLogMeta,
  shouldTruncateLog
} from '../../shared/file-log'

describe('file-log helpers', () => {
  it('truncates when size reaches 400 KB', () => {
    expect(shouldTruncateLog(APP_LOG_MAX_BYTES - 1)).toBe(false)
    expect(shouldTruncateLog(APP_LOG_MAX_BYTES)).toBe(true)
    expect(shouldTruncateLog(APP_LOG_MAX_BYTES + 10)).toBe(true)
  })

  it('redacts sensitive meta keys', () => {
    expect(
      sanitizeLogMeta({
        password: 'secret',
        token: 'abc',
        projectId: 12
      })
    ).toEqual({
      password: '[redacted]',
      token: '[redacted]',
      projectId: 12
    })
  })

  it('formats a structured line with timestamp and level', () => {
    const at = new Date('2026-08-03T20:00:00.000Z')
    const line = formatAppLogLine('info', 'Boot', { ok: true }, at)
    expect(line).toBe('2026-08-03T20:00:00.000Z [INFO] Boot {"ok":true}\n')
  })
})
