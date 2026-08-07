import { FormEvent, useState } from 'react'
import type { AppError } from '../../shared/types'
import type { UserProfile } from '../../shared/user-profile'

interface Props {
  mode?: 'setup' | 'edit'
  initialProfile?: UserProfile | null
  /** When true (AIDLC_DEV_MODE=false), also collect AWS credentials. */
  askAwsCredentials?: boolean
  awsStorageDirHint?: string | null
  /** Compile-time AWS_REGION (read-only hint). */
  awsRegionHint?: string | null
  onSaved: (profile: UserProfile) => void
  onCancel?: () => void
}

export default function ProfileSetupPage({
  mode = 'setup',
  initialProfile = null,
  askAwsCredentials = false,
  awsStorageDirHint = null,
  awsRegionHint = null,
  onSaved,
  onCancel
}: Props): JSX.Element {
  const isEdit = mode === 'edit'
  const [firstName, setFirstName] = useState(initialProfile?.firstName ?? '')
  const [lastName, setLastName] = useState(initialProfile?.lastName ?? '')
  const [awsAccessKeyId, setAwsAccessKeyId] = useState('')
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<AppError | null>(null)

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    if (askAwsCredentials) {
      const awsResult = await window.aidlcApi.saveAwsLocalCredentials({
        accessKeyId: awsAccessKeyId,
        secretAccessKey: awsSecretAccessKey
      })
      if (!awsResult.ok) {
        setSubmitting(false)
        setError(awsResult.error)
        return
      }
    }

    const result = await window.aidlcApi.saveUserProfile({ firstName, lastName })
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onSaved(result.data)
  }

  return (
    <main className="panel" data-testid="profile-setup-page">
      <h1>{isEdit ? 'Cambiar nombre' : 'Bienvenido'}</h1>
      <p className="muted">
        {isEdit
          ? 'Corrige tu nombre y apellido. Se actualizaran en el encabezado. Si cambian, las observaciones usaran un archivo nuevo (el anterior se conserva).'
          : askAwsCredentials
            ? 'Antes de continuar, indica tu nombre, apellido y credenciales de Amazon Bedrock (AWS). Las credenciales se guardan en el directorio de la aplicacion.'
            : 'Antes de continuar, indica tu nombre y apellido. Se usaran en el encabezado de la aplicacion y para nombrar tu archivo de observaciones (en minusculas y con guiones).'}
      </p>
      {error ? (
        <div className="error" role="alert" data-testid="profile-setup-error">
          <strong>{error.title}</strong>
          <div>{error.message}</div>
        </div>
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)}>
        <label className="field" htmlFor="profile-first-name">
          Nombre
          <input
            id="profile-first-name"
            data-testid="profile-first-name-input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            autoFocus
            required
          />
        </label>
        <label className="field" htmlFor="profile-last-name">
          Apellido
          <input
            id="profile-last-name"
            data-testid="profile-last-name-input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
          />
        </label>
        {askAwsCredentials ? (
          <fieldset className="profile-aws-fieldset" data-testid="profile-aws-fields">
            <legend>Credenciales AWS (Bedrock)</legend>
            {awsStorageDirHint ? (
              <p className="muted">
                Se guardaran en <code>{awsStorageDirHint}/aws-credentials.json</code>
              </p>
            ) : null}
            {awsRegionHint ? (
              <p className="muted" data-testid="aws-region-hint">
                Region AWS (embebida en la compilacion): <code>{awsRegionHint}</code>
              </p>
            ) : null}
            <label className="field" htmlFor="aws-access-key">
              AWS Access Key ID
              <input
                id="aws-access-key"
                data-testid="aws-access-key-input"
                type="password"
                value={awsAccessKeyId}
                onChange={(e) => setAwsAccessKeyId(e.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label className="field" htmlFor="aws-secret-key">
              AWS Secret Access Key
              <input
                id="aws-secret-key"
                data-testid="aws-secret-key-input"
                type="password"
                value={awsSecretAccessKey}
                onChange={(e) => setAwsSecretAccessKey(e.target.value)}
                autoComplete="off"
                required
              />
            </label>
          </fieldset>
        ) : null}
        <div className="profile-setup-actions">
          {isEdit && onCancel ? (
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onCancel}
              disabled={submitting}
              data-testid="profile-setup-cancel"
            >
              Cancelar
            </button>
          ) : null}
          <button
            className="btn"
            type="submit"
            disabled={submitting}
            data-testid="profile-setup-submit"
          >
            {submitting ? 'Guardando…' : isEdit ? 'Guardar' : 'Continuar'}
          </button>
        </div>
      </form>
    </main>
  )
}
