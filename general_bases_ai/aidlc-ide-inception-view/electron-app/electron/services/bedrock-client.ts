import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message
} from '@aws-sdk/client-bedrock-runtime'
import { AI_ERROR, VALIDATION_ERROR } from '../../shared/errors'
import type { AppError, ChatMessage, FileEdit } from '../../shared/types'
import { assertUnderDocs, asAppError, DOCS_ROOT } from '../../shared/path-guard'
import { DEFAULT_AWS_REGION, DEFAULT_BEDROCK_MODEL } from '../../shared/ai-config'

export { DEFAULT_AWS_REGION, DEFAULT_BEDROCK_MODEL }

export interface AiTurnResult {
  assistantMessage: string
  edits: FileEdit[]
}

export interface BedrockCredentials {
  accessKeyId: string
  secretAccessKey: string
  region?: string
  modelId?: string
  sessionToken?: string
}

function isAppError(e: unknown): e is AppError {
  return Boolean(e && typeof e === 'object' && 'code' in e && 'message' in e)
}

function buildSystemPrompt(ctx: {
  selectedPath?: string | null
  selectedContent?: string | null
  draftPaths: string[]
  workspaceIndex?: string
  relevantDocs?: string
}): string {
  return [
    'Eres un AGENTE de edicion de documentacion AI-DLC (no un consultor que solo aconseja).',
    `Solo puedes modificar archivos bajo "${DOCS_ROOT}/".`,
    'Cuando el usuario pida unificar, actualizar, editar, crear o cambiar historias/requisitos/documentos:',
    '1) Debes aplicar el cambio en edits[] (borradores locales).',
    '2) message debe ser un resumen corto de QUE archivos tocaste y QUE hiciste.',
    '3) PROHIBIDO responder solo con un ejemplo de HU en markdown dentro de message sin edits[].',
    '4) Cada edit.content debe ser el archivo COMPLETO resultante (no un fragmento ni un diff).',
    '5) Usa el contenido real de DOCUMENTOS RELEVANTES / indice; no inventes HUs de otros dominios.',
    'Los edits se guardan SOLO como borradores locales hasta que el usuario pulse Solicitar cambios (MR a dev).',
    'Responde SIEMPRE en espanol.',
    'REGLA CRITICA DE CONTEXTO:',
    '- Usa SOLO el indice y los documentos relevantes incluidos abajo (y el archivo abierto).',
    '- NO des consejos genericos si la pregunta es sobre HUs/requisitos del proyecto: cita rutas, IDs (HU-/US-/FR-) y relaciones reales de los documentos.',
    '- Si no tienes suficiente texto de un archivo para reescribirlo entero, dilo en message y edits=[].',
    'Tu respuesta debe ser UN unico objeto JSON valido (sin markdown fences) con esta forma:',
    '{',
    '  "message": "resumen breve de la accion",',
    '  "edits": [ { "path": "aidlc-docs/....md", "content": "contenido completo del archivo" } ]',
    '}',
    'Solo usa "edits": [] si la pregunta es puramente informativa (sin pedir cambios).',
    ctx.selectedPath
      ? `Archivo abierto actualmente: ${ctx.selectedPath}`
      : 'No hay archivo abierto seleccionado.',
    ctx.draftPaths.length
      ? `Borradores locales existentes: ${ctx.draftPaths.join(', ')}`
      : 'No hay borradores locales todavia.',
    ctx.workspaceIndex || '',
    ctx.relevantDocs || '',
    ctx.selectedPath && ctx.selectedContent != null
      ? `Contenido actual del archivo abierto (puede estar truncado):\n---\n${ctx.selectedContent}\n---`
      : ''
  ]
    .filter(Boolean)
    .join('\n')
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    /* try fenced block */
  }
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed)
  if (fence) {
    return JSON.parse(fence[1].trim())
  }
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1))
  }
  throw new Error('invalid json')
}

function normalizeEdits(raw: unknown): FileEdit[] {
  if (!Array.isArray(raw)) return []
  const edits: FileEdit[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const path = String((item as { path?: string }).path || '').trim()
    const content = (item as { content?: string }).content
    if (!path || typeof content !== 'string') continue
    try {
      const safe = assertUnderDocs(path)
      edits.push({ path: safe, content })
    } catch {
      /* skip invalid paths */
    }
  }
  return edits
}

/** Bedrock Converse requires alternating user/assistant roles. */
function toConverseMessages(messages: ChatMessage[]): Message[] {
  const out: Message[] = []
  for (const m of messages) {
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    const text = m.content
    const last = out[out.length - 1]
    if (last && last.role === role) {
      const prev = last.content?.[0]
      const prevText = prev && 'text' in prev ? prev.text || '' : ''
      last.content = [{ text: `${prevText}\n${text}` }]
    } else {
      out.push({ role, content: [{ text }] })
    }
  }
  if (out.length && out[0].role !== 'user') {
    out.unshift({ role: 'user', content: [{ text: '(inicio)' }] })
  }
  return out
}

export async function runBedrockChat(opts: {
  credentials: BedrockCredentials
  messages: ChatMessage[]
  selectedPath?: string | null
  selectedContent?: string | null
  draftPaths: string[]
  workspaceIndex?: string
  relevantDocs?: string
}): Promise<{ ok: true; data: AiTurnResult } | { ok: false; error: AppError }> {
  try {
    const accessKeyId = opts.credentials.accessKeyId?.trim()
    const secretAccessKey = opts.credentials.secretAccessKey?.trim()
    if (!accessKeyId || !secretAccessKey) {
      return {
        ok: false,
        error: AI_ERROR('Faltan AWS_ACCESS_KEY_ID o AWS_SECRET_ACCESS_KEY en la configuracion.')
      }
    }
    if (!opts.messages.length) {
      return { ok: false, error: VALIDATION_ERROR('El mensaje no puede estar vacio.') }
    }

    const region = (opts.credentials.region || DEFAULT_AWS_REGION).trim() || DEFAULT_AWS_REGION
    const modelId =
      (opts.credentials.modelId || DEFAULT_BEDROCK_MODEL).trim() || DEFAULT_BEDROCK_MODEL

    const client = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(opts.credentials.sessionToken?.trim()
          ? { sessionToken: opts.credentials.sessionToken.trim() }
          : {})
      }
    })

    const command = new ConverseCommand({
      modelId,
      system: [
        {
          text: buildSystemPrompt({
            selectedPath: opts.selectedPath,
            selectedContent: opts.selectedContent,
            draftPaths: opts.draftPaths,
            workspaceIndex: opts.workspaceIndex,
            relevantDocs: opts.relevantDocs
          })
        }
      ],
      messages: toConverseMessages(opts.messages),
      inferenceConfig: {
        maxTokens: 8192,
        temperature: 0.2
      }
    })

    const response = await client.send(command)
    const blocks = response.output?.message?.content || []
    const text = blocks
      .map((b) => ('text' in b && b.text ? b.text : ''))
      .join('')
      .trim()

    if (!text) {
      return { ok: false, error: AI_ERROR('Amazon Nova devolvio una respuesta vacia.') }
    }

    let parsed: { message?: string; edits?: unknown }
    try {
      parsed = extractJsonObject(text) as { message?: string; edits?: unknown }
    } catch {
      return {
        ok: true,
        data: {
          assistantMessage: text,
          edits: []
        }
      }
    }

    return {
      ok: true,
      data: {
        assistantMessage:
          typeof parsed.message === 'string' && parsed.message.trim()
            ? parsed.message.trim()
            : 'Listo. Revise los borradores locales si hubo ediciones.',
        edits: normalizeEdits(parsed.edits)
      }
    }
  } catch (e) {
    if (isAppError(e)) return { ok: false, error: e }
    if (asAppError(e)) return { ok: false, error: asAppError(e)! }
    const msg = e instanceof Error ? e.message : String(e)
    if (/AccessDenied|UnrecognizedClient|InvalidSignature|security token/i.test(msg)) {
      return {
        ok: false,
        error: AI_ERROR(
          'AWS rechazo las credenciales o no hay permiso bedrock:InvokeModel. Revisa claves, region us-east-1 y acceso al modelo Nova.'
        )
      }
    }
    if (/ValidationException|ResourceNotFound|model/i.test(msg)) {
      return {
        ok: false,
        error: AI_ERROR(
          `Modelo Bedrock no disponible (${opts.credentials.modelId || DEFAULT_BEDROCK_MODEL}). Activa Amazon Nova en us-east-1. ${msg.slice(0, 160)}`
        )
      }
    }
    return { ok: false, error: AI_ERROR(msg.slice(0, 240)) }
  }
}
