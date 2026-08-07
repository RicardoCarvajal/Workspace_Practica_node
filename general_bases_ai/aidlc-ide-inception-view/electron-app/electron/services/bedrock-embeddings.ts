import { AI_ERROR, VALIDATION_ERROR } from '../../shared/errors'
import type { AppError } from '../../shared/types'
import {
  BEDROCK_REQUEST_TIMEOUT_MS,
  DEFAULT_EMBEDDING_DIMENSIONS,
  EMBEDDING_CONCURRENCY
} from '../../shared/ai-config'
import {
  getAwsBedrockConfig,
  awsConfigHint,
  awsConfigDiagnostics
} from '../config/aws-config'
import { signedBedrockFetch } from './bedrock-http'

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

function diagSuffix(): string {
  const d = awsConfigDiagnostics()
  if (!d.configured) return ''
  return ` [creds=${d.source}, key=...${d.accessKeyIdSuffix}, region=${d.region}, sessionToken=${d.hasSessionToken ? 'si' : 'no'}]`
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  async function run(): Promise<void> {
    while (next < items.length) {
      const i = next
      next += 1
      results[i] = await worker(items[i]!, i)
    }
  }
  const n = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: n }, () => run()))
  return results
}

async function embedOneWithSdk(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  InvokeModelCommand: any,
  modelId: string,
  text: string
): Promise<number[]> {
  const body = JSON.stringify({
    inputText: text.slice(0, 8000),
    dimensions: DEFAULT_EMBEDDING_DIMENSIONS,
    normalize: true
  })
  const out = await client.send(
    new InvokeModelCommand({
      modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: new TextEncoder().encode(body)
    }),
    {
      abortSignal: AbortSignal.timeout(BEDROCK_REQUEST_TIMEOUT_MS)
    }
  )
  const raw = new TextDecoder().decode(out.body)
  const parsed = JSON.parse(raw) as { embedding?: number[] }
  if (!Array.isArray(parsed.embedding) || parsed.embedding.length === 0) {
    throw AI_ERROR('Respuesta de embeddings sin vector.')
  }
  return parsed.embedding
}

async function embedWithSdk(
  texts: string[]
): Promise<{ ok: true; data: number[][] } | { ok: false; error: AppError } | null> {
  const cfg = getAwsBedrockConfig()
  if (!cfg) return { ok: false, error: VALIDATION_ERROR(awsConfigHint()) }
  try {
    const mod = await import('@aws-sdk/client-bedrock-runtime')
    const client = new mod.BedrockRuntimeClient({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
        sessionToken: cfg.sessionToken
      }
    })
    const vectors = await mapPool(texts, EMBEDDING_CONCURRENCY, (text) =>
      embedOneWithSdk(client, mod.InvokeModelCommand, cfg.embeddingModelId, text)
    )
    return { ok: true, data: vectors }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Cannot find module') || msg.includes('ERR_MODULE_NOT_FOUND')) {
      return null
    }
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: AI_ERROR(`${msg}${diagSuffix()}`) }
  }
}

async function embedOneWithHttp(
  cfg: NonNullable<ReturnType<typeof getAwsBedrockConfig>>,
  text: string
): Promise<number[]> {
  const body = JSON.stringify({
    inputText: text.slice(0, 8000),
    dimensions: DEFAULT_EMBEDDING_DIMENSIONS,
    normalize: true
  })
  const res = await signedBedrockFetch({
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    sessionToken: cfg.sessionToken,
    method: 'POST',
    path: `/model/${cfg.embeddingModelId}/invoke`,
    body
  })
  const raw = await res.text()
  if (!res.ok) {
    throw AI_ERROR(
      `Embeddings Bedrock HTTP ${res.status}: ${raw.slice(0, 200) || awsConfigHint()}${diagSuffix()}`
    )
  }
  const parsed = JSON.parse(raw) as { embedding?: number[] }
  if (!Array.isArray(parsed.embedding) || parsed.embedding.length === 0) {
    throw AI_ERROR('Respuesta de embeddings sin vector.')
  }
  return parsed.embedding
}

async function embedWithHttp(
  texts: string[]
): Promise<{ ok: true; data: number[][] } | { ok: false; error: AppError }> {
  const cfg = getAwsBedrockConfig()
  if (!cfg) return { ok: false, error: VALIDATION_ERROR(awsConfigHint()) }

  try {
    const vectors = await mapPool(texts, EMBEDDING_CONCURRENCY, (text) =>
      embedOneWithHttp(cfg, text)
    )
    return { ok: true, data: vectors }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return {
      ok: false,
      error: AI_ERROR(
        `${e instanceof Error ? e.message : 'Error HTTP embeddings.'}${diagSuffix()}`
      )
    }
  }
}

export async function embedTexts(
  texts: string[]
): Promise<{ ok: true; data: number[][] } | { ok: false; error: AppError }> {
  if (texts.length === 0) return { ok: true, data: [] }
  try {
    const viaSdk = await embedWithSdk(texts)
    if (viaSdk) return viaSdk
    return embedWithHttp(texts)
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return {
      ok: false,
      error: AI_ERROR(
        `${e instanceof Error ? e.message : 'No se pudo generar embeddings con Titan.'}${diagSuffix()}`
      )
    }
  }
}
