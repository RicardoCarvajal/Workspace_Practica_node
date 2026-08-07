import { createHash, createHmac } from 'crypto'
import { request as httpsRequest } from 'https'
import { BEDROCK_REQUEST_TIMEOUT_MS } from '../../shared/ai-config'

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest()
}

function sha256Hex(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex')
}

function uriEncode(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (c) => {
    return `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  })
}

/** Encode path for SigV4 + HTTP request (segment by segment). */
export function encodeAwsPath(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized
    .split('/')
    .map((seg, i) => (i === 0 && seg === '' ? '' : uriEncode(seg)))
    .join('/')
}

function amzDate(date: Date): { amz: string; day: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { amz: `${iso.slice(0, 15)}Z`, day: iso.slice(0, 8) }
}

/**
 * Bedrock Runtime signed POST via Node https (full control of headers/body bytes).
 */
export async function signedBedrockFetch(opts: {
  region: string
  accessKeyId: string
  secretAccessKey: string
  sessionToken?: string
  method: 'POST'
  path: string
  body: string
}): Promise<Response> {
  const host = `bedrock-runtime.${opts.region}.amazonaws.com`
  const service = 'bedrock'
  const { amz, day } = amzDate(new Date())
  const bodyBuf = Buffer.from(opts.body, 'utf8')
  const payloadHash = sha256Hex(bodyBuf)
  const canonicalUri = encodeAwsPath(opts.path)

  const headersToSign: Record<string, string> = {
    host,
    'content-type': 'application/json',
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amz
  }
  if (opts.sessionToken) {
    headersToSign['x-amz-security-token'] = opts.sessionToken
  }

  const signedHeaderKeys = Object.keys(headersToSign).sort()
  const canonicalHeaders = signedHeaderKeys
    .map((k) => `${k}:${headersToSign[k]!.replace(/\s+/g, ' ').trim()}\n`)
    .join('')
  const signedHeaders = signedHeaderKeys.join(';')

  const canonicalRequest = [
    opts.method,
    canonicalUri,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n')

  const credentialScope = `${day}/${opts.region}/${service}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amz,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n')

  const kDate = hmac(`AWS4${opts.secretAccessKey}`, day)
  const kRegion = hmac(kDate, opts.region)
  const kService = hmac(kRegion, service)
  const kSigning = hmac(kService, 'aws4_request')
  const signature = hmac(kSigning, stringToSign).toString('hex')

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${opts.accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`
  ].join(', ')

  const reqHeaders: Record<string, string> = {
    Host: host,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Amz-Content-Sha256': payloadHash,
    'X-Amz-Date': amz,
    Authorization: authorization,
    'Content-Length': String(bodyBuf.length)
  }
  if (opts.sessionToken) {
    reqHeaders['X-Amz-Security-Token'] = opts.sessionToken
  }

  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: host,
        path: canonicalUri,
        method: 'POST',
        headers: reqHeaders,
        timeout: BEDROCK_REQUEST_TIMEOUT_MS
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const buf = Buffer.concat(chunks)
          resolve(
            new Response(buf, {
              status: res.statusCode ?? 500,
              statusText: res.statusMessage,
              headers: res.headers as HeadersInit
            })
          )
        })
      }
    )
    req.setTimeout(BEDROCK_REQUEST_TIMEOUT_MS, () => {
      req.destroy(new Error(`Bedrock timeout tras ${BEDROCK_REQUEST_TIMEOUT_MS}ms`))
    })
    req.on('error', reject)
    req.write(bodyBuf)
    req.end()
  })
}
