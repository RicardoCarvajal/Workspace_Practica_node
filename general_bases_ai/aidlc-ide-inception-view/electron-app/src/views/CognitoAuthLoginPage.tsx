import { FormEvent, useState } from 'react'
import type { AppError } from '../../shared/types'
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle'

interface Props {
  onAuthenticated: () => void
  onNeedNewPassword: (ctx: { username: string; session: string }) => void
}

export default function CognitoAuthLoginPage({
  onAuthenticated,
  onNeedNewPassword
}: Props): JSX.Element {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setUsernameError(null)
    setPasswordError(null)
    setError(null)

    let ok = true
    if (!username.trim()) {
      setUsernameError('El usuario es obligatorio.')
      ok = false
    }
    if (!password) {
      setPasswordError('La contrasena es obligatoria.')
      ok = false
    }
    if (!ok) return

    setSubmitting(true)
    const result = await window.aidlcApi.cognitoLogin({
      username: username.trim(),
      password
    })
    setSubmitting(false)

    if ('challenge' in result && result.ok && result.challenge) {
      setPassword('')
      onNeedNewPassword({
        username: result.data.username,
        session: result.data.session
      })
      return
    }

    if (!result.ok) {
      setError(result.error)
      return
    }

    setPassword('')
    onAuthenticated()
  }

  return (
    <main className="panel" data-testid="cognito-auth-login-page">
      <h1>Iniciar sesion</h1>
      <p className="muted">Ingresa tu usuario y contrasena para continuar.</p>
      {error ? (
        <div className="error" role="alert" data-testid="cognito-login-error">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)}>
        <label className="field" htmlFor="cognito-username">
          Usuario
          <input
            id="cognito-username"
            data-testid="cognito-username-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            disabled={submitting}
            aria-invalid={Boolean(usernameError)}
          />
          {usernameError ? (
            <span className="field-error" role="alert">
              {usernameError}
            </span>
          ) : null}
        </label>
        <label className="field" htmlFor="cognito-password">
          Contrasena
          <div className="password-field-wrap">
            <input
              id="cognito-password"
              data-testid="cognito-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
              aria-invalid={Boolean(passwordError)}
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              disabled={submitting}
              labelledBy="cognito-password"
            />
          </div>
          {passwordError ? (
            <span className="field-error" role="alert">
              {passwordError}
            </span>
          ) : null}
        </label>
        <button
          className="btn"
          type="submit"
          disabled={submitting}
          data-testid="cognito-login-submit"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
