/** Runtime app config from API Secret — Main memory only. */

let values: Record<string, string> = {}
let loadedAt: number | null = null

export function isRuntimeConfigLoaded(): boolean {
  return loadedAt !== null && Object.keys(values).length > 0
}

export function getRuntimeConfig(): Record<string, string> {
  return { ...values }
}

export function getRuntimeConfigValue(key: string): string | undefined {
  const v = values[key]
  if (v == null) return undefined
  const t = v.trim()
  return t === '' ? undefined : t
}

export function setRuntimeConfig(config: Record<string, unknown>): void {
  const next: Record<string, string> = {}
  for (const [key, raw] of Object.entries(config)) {
    if (raw == null) continue
    next[key] = String(raw)
  }
  values = next
  loadedAt = Date.now()
}

export function clearRuntimeConfig(): void {
  values = {}
  loadedAt = null
}

/** Apply loaded config into process.env for existing consumers (GitLab/AWS). */
export function applyRuntimeConfigToProcessEnv(): void {
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value
  }
}
