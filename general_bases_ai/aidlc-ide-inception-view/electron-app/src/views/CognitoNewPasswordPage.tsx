import { FormEvent, useState } from 'react'
import type { AppError } from '../../shared/types'
import PasswordVisibilityToggle from '../components/PasswordVisibilityToggle'

interface Props {
  username: string
  session: string
  onAuthenticated: () => void
  onCancel: () => void
}

export default function CognitoNewPasswordPage({
  username,
  session,
  onAuthenticated,
  onCancel
}: Props): JSX.Element {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<AppError | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    if (!newPassword || !confirmPassword) {
      setFieldError('La nueva contrasena es obligatoria.')
      return
    }
    if (newPassword !== confirmPassword) {
      setFieldError('Las contrasenas no coinciden.')
      return
    }

    setSubmitting(true)
    const result = await window.aidlcApi.cognitoRespondNewPassword({
      username,
      session,
      newPassword
    })
    setSubmitting(false)

    if (!result.ok) {
      setError(result.error)
      return
    }
    onAuthenticated()
  }

  return (
    <main className="panel" data-testid="cognito-new-password-page">
      <h1>Nueva contrasena</h1>
      <p className="muted">
        Debes definir una nueva contrasena para el usuario <strong>{username}</strong>.
      </p>
      <div
        className="password-policy"
        id="password-policy-hint"
        data-testid="password-policy"
      >
        <strong>Politica de contrasena</strong>
        <ul>
          <li>Minimo 8 caracteres</li>
          <li>Al menos una letra mayuscula (A-Z)</li>
          <li>Al menos una letra minuscula (a-z)</li>
          <li>Al menos un numero (0-9)</li>
          <li>No se requieren simbolos</li>
          <li>No puede ser igual a la contrasena temporal</li>
        </ul>
      </div>
      {error ? (
        <div className="error" role="alert">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)}>
        <label className="field" htmlFor="cognito-new-password">
          Nueva contrasena
          <div className="password-field-wrap">
            <input
              id="cognito-new-password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              disabled={submitting}
              aria-describedby="password-policy-hint"
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              disabled={submitting}
              labelledBy="cognito-new-password"
            />
          </div>
        </label>
        <label className="field" htmlFor="cognito-confirm-password">
          Confirmar contrasena
          <div className="password-field-wrap">
            <input
              id="cognito-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={submitting}
            />
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              disabled={submitting}
              labelledBy="cognito-confirm-password"
            />
          </div>
        </label>
        {fieldError ? (
          <p className="field-error" role="alert">
            {fieldError}
          </p>
        ) : null}
        <div className="button-row">
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? 'Guardando…' : 'Continuar'}
          </button>
        </div>
      </form>
    </main>
  )
}
