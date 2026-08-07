import react from '@vitejs/plugin-react'
import { config as loadDotenv, parse as parseDotenv } from 'dotenv'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

/** Load root `.env` without overriding already-set process.env. */
function ensureBuildEnvFromDotenv(): void {
  const envPath = resolve(__dirname, '.env')
  if (!existsSync(envPath)) return
  loadDotenv({ path: envPath, override: false })
}

function nonEmpty(value: string | undefined | null): string | undefined {
  if (value == null) return undefined
  const t = value.trim()
  return t === '' ? undefined : value.trim()
}

function readEnvMap(): Record<string, string> {
  ensureBuildEnvFromDotenv()
  const map: Record<string, string> = { ...process.env } as Record<string, string>
  const envPath = resolve(__dirname, '.env')
  if (existsSync(envPath)) {
    try {
      const parsed = parseDotenv(readFileSync(envPath))
      for (const [k, v] of Object.entries(parsed)) {
        if (nonEmpty(map[k]) === undefined && nonEmpty(v) !== undefined) {
          map[k] = v
        }
      }
    } catch {
      /* ignore */
    }
  }
  return map
}

/**
 * Bake only the auth-api base URL into Main.
 * Prefer AIDLC_EMBED_CONFIG_API_URL (release script); fall back to AIDLC_CONFIG_API_URL.
 * GitLab/AWS/DEV flags come from the API Secret after Cognito login — never baked.
 */
function embeddedConfigApiUrlDefine(): string {
  const env = readEnvMap()
  const url =
    nonEmpty(env.AIDLC_EMBED_CONFIG_API_URL) || nonEmpty(env.AIDLC_CONFIG_API_URL)
  if (!url) return 'null'
  return JSON.stringify(url.replace(/\/+$/, ''))
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __AIDLC_EMBEDDED_CONFIG_API_URL__: embeddedConfigApiUrlDefine(),
      // Legacy defines kept as null so old references compile cleanly during migration.
      __AIDLC_EMBEDDED_CONFIG__: 'null',
      __AIDLC_EMBEDDED_AWS_REGION__: 'undefined'
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/main/index.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'electron/preload/index.ts')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('shared')
      }
    }
  },
  renderer: {
    root: resolve('src'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('shared'),
        '@renderer': resolve('src')
      }
    },
    plugins: [react()]
  }
})
