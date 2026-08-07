import { AI_ERROR, VALIDATION_ERROR } from '../../shared/errors'
import type { AppError, ChatMessage } from '../../shared/types'
import type { ChatCitation } from '../../shared/chat-rag'
import {
  emptyTokenUsage,
  normalizeTokenUsage,
  type TokenUsage
} from '../../shared/rag-chunk'
import { BEDROCK_REQUEST_TIMEOUT_MS } from '../../shared/ai-config'
import { getAwsBedrockConfig, awsConfigHint, awsConfigDiagnostics } from '../config/aws-config'
import { signedBedrockFetch } from './bedrock-http'

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

function diagSuffix(): string {
  const d = awsConfigDiagnostics()
  if (!d.configured) return ''
  return ` [creds=${d.source}, key=...${d.accessKeyIdSuffix}, region=${d.region}, sessionToken=${d.hasSessionToken ? 'si' : 'no'}]`
}

function buildSystemPrompt(
  chunks: Array<{ path: string; text: string }>,
  openPath?: string | null
): string {
  const docs = chunks
    .map((c, i) => `[${i + 1}] Ruta: ${c.path}\n${c.text}`)
    .join('\n\n---\n\n')
  return [
    'Eres un asistente de analisis de documentacion AI-DLC (fase inception).',
    'Responde SIEMPRE en espanol.',
    'Solo analizas y respondes preguntas. NO propongas ni inventes ediciones de archivos.',
    'Usa SOLO los fragmentos recuperados abajo. Si no hay suficiente evidencia, dilo claramente.',
    'Cita las rutas de los documentos usados (entre backticks).',
    openPath ? `El usuario tiene abierto: ${openPath}` : '',
    'FRAGMENTOS RECUPERADOS:',
    docs || '(sin fragmentos)'
  ]
    .filter(Boolean)
    .join('\n')
}

type ChatOk = {
  ok: true
  data: { message: string; citations: ChatCitation[]; usage: TokenUsage }
}
type ChatErr = { ok: false; error: AppError }

async function chatWithSdk(opts: {
  history: ChatMessage[]
  userMessage: string
  chunks: Array<{ path: string; text: string }>
  openPath?: string | null
}): Promise<ChatOk | ChatErr | null> {
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
    const messages = [
      ...opts.history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: [{ text: m.content }]
        })),
      { role: 'user' as const, content: [{ text: opts.userMessage }] }
    ]
    const out = await client.send(
      new mod.ConverseCommand({
        modelId: cfg.chatModelId,
        system: [{ text: buildSystemPrompt(opts.chunks, opts.openPath) }],
        messages,
        inferenceConfig: { maxTokens: 2048, temperature: 0.2 }
      }),
      { abortSignal: AbortSignal.timeout(BEDROCK_REQUEST_TIMEOUT_MS) }
    )
    const parts = out.output?.message?.content ?? []
    const message = parts
      .map((p) => ('text' in p && p.text ? p.text : ''))
      .join('\n')
      .trim()
    if (!message) return { ok: false, error: AI_ERROR('Nova devolvio una respuesta vacia.') }
    const citations: ChatCitation[] = opts.chunks.slice(0, 6).map((c) => ({
      path: c.path,
      excerpt: c.text.slice(0, 240)
    }))
    const usage = out.usage
      ? normalizeTokenUsage({
          inputTokens: out.usage.inputTokens,
          outputTokens: out.usage.outputTokens,
          totalTokens: out.usage.totalTokens
        })
      : emptyTokenUsage()
    return { ok: true, data: { message, citations, usage } }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('Cannot find module') || msg.includes('ERR_MODULE_NOT_FOUND')) {
      return null
    }
    if (isAppError(e)) return { ok: false, error: e }
    return { ok: false, error: AI_ERROR(`${msg}${diagSuffix()}`) }
  }
}

async function chatWithHttp(opts: {
  history: ChatMessage[]
  userMessage: string
  chunks: Array<{ path: string; text: string }>
  openPath?: string | null
}): Promise<ChatOk | ChatErr> {
  const cfg = getAwsBedrockConfig()
  if (!cfg) return { ok: false, error: VALIDATION_ERROR(awsConfigHint()) }

  const messages = [
    ...opts.history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role,
        content: [{ text: m.content }]
      })),
    { role: 'user' as const, content: [{ text: opts.userMessage }] }
  ]
  const body = JSON.stringify({
    system: [{ text: buildSystemPrompt(opts.chunks, opts.openPath) }],
    messages,
    inferenceConfig: { maxTokens: 2048, temperature: 0.2 }
  })
  const res = await signedBedrockFetch({
    region: cfg.region,
    accessKeyId: cfg.accessKeyId,
    secretAccessKey: cfg.secretAccessKey,
    sessionToken: cfg.sessionToken,
    method: 'POST',
    path: `/model/${cfg.chatModelId}/converse`,
    body
  })
  const raw = await res.text()
  if (!res.ok) {
    return {
      ok: false,
      error: AI_ERROR(`Nova HTTP ${res.status}: ${raw.slice(0, 220)}${diagSuffix()}`)
    }
  }
  const parsed = JSON.parse(raw) as {
    output?: { message?: { content?: Array<{ text?: string }> } }
    usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number }
  }
  const parts = parsed.output?.message?.content ?? []
  const message = parts
    .map((p) => p.text || '')
    .join('\n')
    .trim()
  if (!message) return { ok: false, error: AI_ERROR('Nova devolvio una respuesta vacia.') }
  const citations: ChatCitation[] = opts.chunks.slice(0, 6).map((c) => ({
    path: c.path,
    excerpt: c.text.slice(0, 240)
  }))
  const usage = parsed.usage ? normalizeTokenUsage(parsed.usage) : emptyTokenUsage()
  return { ok: true, data: { message, citations, usage } }
}

export async function runAnalysisChat(opts: {
  history: ChatMessage[]
  userMessage: string
  chunks: Array<{ path: string; text: string }>
  openPath?: string | null
}): Promise<ChatOk | ChatErr> {
  const text = opts.userMessage.trim()
  if (!text) {
    return { ok: false, error: VALIDATION_ERROR('Escribe un mensaje.') }
  }
  try {
    const viaSdk = await chatWithSdk({ ...opts, userMessage: text })
    if (viaSdk) return viaSdk
    return chatWithHttp({ ...opts, userMessage: text })
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    return {
      ok: false,
      error: AI_ERROR(
        `${e instanceof Error ? e.message : 'Error al llamar a Amazon Nova.'}${diagSuffix()}`
      )
    }
  }
}
