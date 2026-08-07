/** Local AWS credentials when AIDLC_DEV_MODE=false (production / non-dev).
 * Region is NOT stored here — comes from runtime config (auth-api Secret) / env.
 */

export interface AwsLocalCredentials {
  accessKeyId: string
  secretAccessKey: string
}

/** Safe status for Renderer (no secrets). */
export interface AwsLocalStatus {
  /** True when AIDLC_DEV_MODE is false → ask and store credentials locally. */
  promptMode: boolean
  /** True when a local credentials file exists and is valid. */
  configured: boolean
  /** Directory where the file is stored (diagnostics). */
  storageDir?: string
  /** Region from runtime config / env (informational). */
  region?: string
}

export function validateAwsLocalCredentials(input: {
  accessKeyId?: string
  secretAccessKey?: string
}): { ok: true; data: AwsLocalCredentials } | { ok: false; message: string } {
  const accessKeyId = String(input.accessKeyId ?? '').trim()
  const secretAccessKey = String(input.secretAccessKey ?? '').trim()

  if (!accessKeyId) {
    return { ok: false, message: 'Ingresa AWS Access Key ID.' }
  }
  if (!secretAccessKey) {
    return { ok: false, message: 'Ingresa AWS Secret Access Key.' }
  }

  return {
    ok: true,
    data: {
      accessKeyId,
      secretAccessKey
    }
  }
}
