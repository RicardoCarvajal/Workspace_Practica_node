import { FormEvent, useEffect, useState } from 'react'
import type { AppError } from '../../shared/types'
import type { BootstrapInfo } from '../../shared/runtime-config'

const DEFAULT_URL = 'https://git.intelix.biz'

interface Props {
  onSuccess: () => void
  bootstrap: BootstrapInfo | null
  onRetryLocked: () => void
}

export default function LoginPage({ onSuccess, bootstrap, onRetryLocked }: Props): JSX.Element {
  const locked = Boolean(bootstrap?.credentialsLocked)
  const [baseUrl, setBaseUrl] = useState(DEFAULT_URL)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<AppError | null>(bootstrap?.error ?? null)

  useEffect(() => {
    setError(bootstrap?.error ?? null)
  }, [bootstrap])

  useEffect(() => {
    if (locked) return
    void window.aidlcApi.getRememberedLogin().then((hint) => {
      if (!hint) return
      setBaseUrl(hint.baseUrl || DEFAULT_URL)
      setUsername(hint.username || '')
    })
  }, [locked])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (locked) return
    setSubmitting(true)
    setError(null)
    const result = await window.aidlcApi.login({ baseUrl, username, password })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPassword('')
    onSuccess()
  }

  if (locked) {
    return (
      <main className="panel" data-testid="login-page-locked">
        <h1>Conexion</h1>
        <p className="muted">
          Las credenciales de GitLab vienen de la configuracion de compilacion o del archivo{' '}
          <code>.env</code> local. No se pueden ver ni editar en la aplicacion.
        </p>
        {bootstrap?.baseUrlLabel ? (
          <p className="muted" data-testid="locked-baseurl">
            Servidor: <strong>{bootstrap.baseUrlLabel}</strong>
            {bootstrap.username ? (
              <>
                {' '}
                · Usuario: <strong>{bootstrap.username}</strong>
              </>
            ) : null}
          </p>
        ) : null}
        {error ? (
          <div className="error" role="alert" data-testid="login-error">
            <strong>{error.title}</strong>
            <div>{error.message}</div>
          </div>
        ) : (
          <p className="muted">No hay sesion activa.</p>
        )}
        <button className="btn" type="button" data-testid="login-retry-button" onClick={onRetryLocked}>
          Reintentar conexion
        </button>
      </main>
    )
  }

  return (
    <main className="panel" data-testid="login-page">
      <h1>Iniciar sesion</h1>
      <p className="muted">
        Modo manual (sin .env completo). Preferible: configura <code>GITLAB_*</code> en{' '}
        <code>.env</code> o el entorno.
      </p>
      {error ? (
        <div className="error" role="alert" data-testid="login-error">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}
      <form onSubmit={onSubmit} data-testid="login-form">
        <label className="field">
          URL GitLab
          <input
            data-testid="login-baseurl-input"
            value={baseUrl}
            onChange={(ev) => setBaseUrl(ev.target.value)}
            required
          />
        </label>
        <label className="field">
          Usuario
          <input
            data-testid="login-username-input"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label className="field">
          Contrasena o token (PAT)
          <input
            data-testid="login-password-input"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            autoComplete="current-password"
            placeholder="Contrasena o glpat-…"
          />
        </label>
        <button className="btn" type="submit" disabled={submitting} data-testid="login-submit-button">
          {submitting ? 'Conectando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
