import { execFileSync } from 'child_process'
import { parse as parseDotenv } from 'dotenv'
import { existsSync, readFileSync } from 'fs'
import {
  DEFAULT_BEDROCK_EMBEDDING_MODEL,
  DEFAULT_BEDROCK_MODEL
} from '../../shared/ai-config'
import { isAwsPromptMode } from '../config/aws-mode'
import {
  ensureDotenv,
  findEnvFilePath,
  getResolvedAwsRegion,
  getSystemAwsEnv
} from '../config/load-config'
import {
  loadAwsLocalCredentials,
  resolveAwsCredentialsDir
} from '../stores/aws-credentials-store'
import { getRuntimeConfigValue } from '../stores/runtime-config-store'

export interface AwsBedrockConfig {
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  region: string
  chatModelId: string
  embeddingModelId: string
  /** Where access key was resolved from (diagnostics; never includes secrets). */
  source: 'local-file' | 'process-env' | 'login-shell' | 'env-file'
}

let cachedConfig: AwsBedrockConfig | null = null

function nonEmpty(v: string | undefined | null): string | undefined {
  if (v == null) return undefined
  let t = v.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim()
  }
  return t === '' ? undefined : t
}

function readFromLoginShell(name: string): string | undefined {
  if (process.platform === 'win32') return undefined
  try {
    const out = execFileSync('bash', ['-lc', `printf '%s' "\${${name}-}"`], {
      encoding: 'utf8',
      timeout: 2500,
      env: process.env,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    return nonEmpty(out)
  } catch {
    return undefined
  }
}

function readEnvFileMap(): Record<string, string> {
  const envPath = findEnvFilePath()
  if (!envPath || !existsSync(envPath)) return {}
  try {
    return parseDotenv(readFileSync(envPath))
  } catch {
    return {}
  }
}

function resolveAwsSecretVar(
  name: string
): {
  value: string | undefined
  source: Exclude<AwsBedrockConfig['source'], 'local-file'>
} {
  ensureDotenv()

  const fromSystem = nonEmpty(getSystemAwsEnv(name))
  if (fromSystem !== undefined) {
    return { value: fromSystem, source: 'process-env' }
  }

  const fromProcess = nonEmpty(process.env[name])
  if (fromProcess !== undefined) {
    return { value: fromProcess, source: 'process-env' }
  }

  const fromShell = readFromLoginShell(name)
  if (fromShell !== undefined) {
    return { value: fromShell, source: 'login-shell' }
  }

  const fromFile = nonEmpty(readEnvFileMap()[name])
  if (fromFile !== undefined) {
    return { value: fromFile, source: 'env-file' }
  }

  return { value: undefined, source: 'process-env' }
}

function resolveAwsRegionFromEnvFile(): string {
  return getResolvedAwsRegion()
}

function resolveOptionalModelId(name: string, fallback: string): string {
  ensureDotenv()
  const fromProcess = nonEmpty(process.env[name])
  if (fromProcess) return fromProcess
  const fromFile = nonEmpty(readEnvFileMap()[name])
  if (fromFile) return fromFile
  return fallback
}

function withModels(
  partial: Omit<AwsBedrockConfig, 'chatModelId' | 'embeddingModelId'>
): AwsBedrockConfig {
  return {
    ...partial,
    chatModelId: resolveOptionalModelId('BEDROCK_MODEL_ID', DEFAULT_BEDROCK_MODEL),
    embeddingModelId: resolveOptionalModelId(
      'BEDROCK_EMBEDDING_MODEL_ID',
      DEFAULT_BEDROCK_EMBEDDING_MODEL
    )
  }
}

function fromLocalFile(): AwsBedrockConfig | null {
  const local = loadAwsLocalCredentials()
  if (!local) return null
  return withModels({
    accessKeyId: local.accessKeyId,
    secretAccessKey: local.secretAccessKey,
    region: getResolvedAwsRegion(),
    source: 'local-file'
  })
}

/**
 * Prefer RuntimeConfigStore (post Cognito API), then env / local file legacy paths.
 */
export function getAwsBedrockConfig(): AwsBedrockConfig | null {
  if (cachedConfig) return cachedConfig

  const fromRuntimeKey = getRuntimeConfigValue('AWS_ACCESS_KEY_ID')
  const fromRuntimeSecret = getRuntimeConfigValue('AWS_SECRET_ACCESS_KEY')
  if (fromRuntimeKey && fromRuntimeSecret) {
    cachedConfig = withModels({
      accessKeyId: fromRuntimeKey,
      secretAccessKey: fromRuntimeSecret,
      sessionToken: getRuntimeConfigValue('AWS_SESSION_TOKEN'),
      region: getRuntimeConfigValue('AWS_REGION') || resolveAwsRegionFromEnvFile(),
      source: 'process-env'
    })
    return cachedConfig
  }

  if (isAwsPromptMode()) {
    cachedConfig = fromLocalFile()
    return cachedConfig
  }

  const accessKey = resolveAwsSecretVar('AWS_ACCESS_KEY_ID')
  const secretKey = resolveAwsSecretVar('AWS_SECRET_ACCESS_KEY')
  if (!accessKey.value || !secretKey.value) {
    return null
  }

  const session = resolveAwsSecretVar('AWS_SESSION_TOKEN')
  cachedConfig = withModels({
    accessKeyId: accessKey.value,
    secretAccessKey: secretKey.value,
    sessionToken: session.value,
    region: resolveAwsRegionFromEnvFile(),
    source: accessKey.source
  })
  return cachedConfig
}

export function clearAwsBedrockConfigCache(): void {
  cachedConfig = null
}

export function awsConfigHint(): string {
  if (isAwsPromptMode()) {
    return `Configura las credenciales AWS en el inicio de la app (se guardan en ${resolveAwsCredentialsDir()}/aws-credentials.json). AIDLC_DEV_MODE=false.`
  }
  return 'Exporta en el sistema AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY (AWS_SESSION_TOKEN si aplica). Define AWS_REGION en el archivo .env (p. ej. us-east-1). Reinicia npm run dev desde una terminal con esas variables.'
}

export function awsConfigDiagnostics(): {
  configured: boolean
  source?: string
  accessKeyIdSuffix?: string
  region?: string
  hasSessionToken?: boolean
} {
  const cfg = getAwsBedrockConfig()
  if (!cfg) return { configured: false }
  return {
    configured: true,
    source: cfg.source,
    accessKeyIdSuffix: cfg.accessKeyId.slice(-4),
    region: cfg.region,
    hasSessionToken: Boolean(cfg.sessionToken)
  }
}
