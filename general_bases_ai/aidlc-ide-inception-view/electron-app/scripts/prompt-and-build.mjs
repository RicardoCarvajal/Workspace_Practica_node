#!/usr/bin/env node
/**
 * Release build from .env + process environment (no interactive prompts):
 * 1) Load project `.env` (does not override existing process.env)
 * 2) Require only AIDLC_CONFIG_API_URL (GitLab/AWS come from auth-api after Cognito login)
 * 3) electron-vite build with API URL baked into Main only
 * 4) electron-builder for the current OS (or AIDLC_DIST_TARGETS)
 *
 * Targets (AIDLC_DIST_TARGETS):
 *   - default / auto: current platform only
 *       linux → tar.gz x64
 *       win32 → portable x64
 *       darwin arm64 → mac Apple Silicon (dmg+zip)
 *       darwin x64 → mac Intel (dmg+zip x64 via --x64)
 *   - linux | win | mac | apple-silicon | mac-arm64 | mac-x64 | all
 *
 * Note: macOS packages must be built on a Mac (electron-builder limitation).
 * Note: electron-builder may download helper tools from GitHub *Releases*
 * of electron-builder-binaries (not a /release folder in that git repo).
 * Linux tar.gz avoids the AppImage helper (appimage-*.7z).
 */
import { config as loadDotenv } from 'dotenv'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, '.env')

function nonEmpty(value) {
  if (value == null) return undefined
  const t = String(value).trim()
  return t === '' ? undefined : String(value).trim()
}

function loadEnvFile() {
  if (!existsSync(envPath)) {
    console.log('No se encontro .env en la raiz del proyecto (se usan solo variables de entorno).')
    return
  }
  loadDotenv({ path: envPath, override: false })
  console.log(`Cargado ${envPath} (sin sobrescribir variables ya definidas en el entorno).`)
}

function collectConfigApiUrl() {
  const apiUrl =
    nonEmpty(process.env.AIDLC_EMBED_CONFIG_API_URL) ||
    nonEmpty(process.env.AIDLC_CONFIG_API_URL)

  if (!apiUrl) {
    console.error('')
    console.error('Faltan datos para compilar.')
    console.error('Define en .env o en el entorno: AIDLC_CONFIG_API_URL')
    console.error(
      'Ejemplo: AIDLC_CONFIG_API_URL=https://xxxx.execute-api.us-east-1.amazonaws.com/dev'
    )
    console.error('')
    process.exit(1)
  }

  return apiUrl.replace(/\/+$/, '')
}

/**
 * Normalize a single AIDLC_DIST_TARGETS token.
 * @returns {'linux'|'win'|'mac-arm64'|'mac-x64'|null}
 */
function normalizeTargetToken(part) {
  const p = part.trim().toLowerCase()
  if (!p) return null
  if (p === 'linux') return 'linux'
  if (p === 'win' || p === 'windows') return 'win'
  if (
    p === 'mac' ||
    p === 'macos' ||
    p === 'darwin' ||
    p === 'apple-silicon' ||
    p === 'mac-arm64' ||
    p === 'arm64'
  ) {
    return 'mac-arm64'
  }
  if (p === 'mac-x64' || p === 'mac-intel' || p === 'intel') return 'mac-x64'
  return undefined
}

/** @returns {{ args: string[], want: Set<string> }} electron-builder CLI args */
function resolveBuilderArgs() {
  const raw = (process.env.AIDLC_DIST_TARGETS || 'auto').trim().toLowerCase()
  const want = new Set()

  if (raw === 'auto' || raw === '') {
    if (process.platform === 'win32') want.add('win')
    else if (process.platform === 'darwin') {
      want.add(process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64')
    } else want.add('linux')
  } else if (raw === 'all') {
    want.add('linux')
    want.add('win')
    // mac omitted from "all" unless on darwin — cannot reliably build .app on Linux/Windows
    if (process.platform === 'darwin') {
      want.add(process.arch === 'arm64' ? 'mac-arm64' : 'mac-x64')
    }
  } else {
    for (const part of raw.split(/[,\s]+/).filter(Boolean)) {
      const token = normalizeTargetToken(part)
      if (token) want.add(token)
      else {
        console.error(
          `AIDLC_DIST_TARGETS invalido: ${part} (usa auto|linux|win|mac|apple-silicon|mac-arm64|mac-x64|all)`
        )
        process.exit(1)
      }
    }
  }

  const needsMac = want.has('mac-arm64') || want.has('mac-x64')
  if (needsMac && process.platform !== 'darwin') {
    console.error('')
    console.error('El empaquetado macOS (Apple Silicon / Intel) debe ejecutarse en un Mac.')
    console.error('En este host usa: AIDLC_DIST_TARGETS=linux o AIDLC_DIST_TARGETS=win')
    console.error('')
    process.exit(1)
  }

  const args = ['electron-builder', '--config', 'electron-builder.yml']
  if (want.has('linux')) args.push('--linux', 'tar.gz')
  if (want.has('win')) args.push('--win', 'portable')
  if (needsMac) {
    // dmg + zip; arch filtered by CLI flags (yml defaults to arm64)
    args.push('--mac', 'dmg', 'zip')
    if (want.has('mac-arm64') && !want.has('mac-x64')) args.push('--arm64')
    if (want.has('mac-x64') && !want.has('mac-arm64')) args.push('--x64')
    if (want.has('mac-arm64') && want.has('mac-x64')) {
      // Both: drop arch filters so electron-builder builds each arch from config.
      // Config currently lists arm64 only — expand for x64 when requested alone via --x64
      // and mac-x64 path uses config override below.
      args.push('--arm64', '--x64')
    }
  }
  return { args, want }
}

function run(cmd, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...env },
      shell: process.platform === 'win32'
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))
    })
  })
}

loadEnvFile()
const configApiUrl = collectConfigApiUrl()

const embedEnv = {
  AIDLC_EMBED_CONFIG_API_URL: configApiUrl,
  AIDLC_CONFIG_API_URL: configApiUrl
}

const { args: builderArgs, want } = resolveBuilderArgs()

console.log('')
console.log('=== Compilacion AIDLC inception view ===')
console.log(`AIDLC_CONFIG_API_URL embebida: ${configApiUrl}`)
console.log(
  '(GitLab/AWS/DEV_MODE se cargan tras login Cognito desde auth-api — no se incrustan.)'
)
console.log(
  `Targets: ${[...want].join(', ')} (override con AIDLC_DIST_TARGETS=auto|linux|win|mac|apple-silicon|mac-x64|all)`
)
console.log('')
console.log(
  'Nota: electron-builder descarga herramientas desde GitHub Releases de'
)
console.log(
  'electron-builder-binaries (tags), no desde una carpeta /release del repositorio.'
)
console.log('Linux usa tar.gz para evitar el helper AppImage (appimage-*.7z).')
console.log('mac (Apple Silicon): dmg + zip arm64 — ejecutar en un Mac.')
console.log('')

console.log('Compilando (electron-vite) con AIDLC_CONFIG_API_URL embebida…')
await run('npx', ['electron-vite', 'build'], embedEnv)

console.log(`\nEmpaquetando: npx ${builderArgs.join(' ')}`)
await run('npx', builderArgs, embedEnv)

console.log('\nListo. Artefactos en ./release/')
