import passwordEye from '../assets/password-eye.png'

interface Props {
  visible: boolean
  onToggle: () => void
  disabled?: boolean
  labelledBy?: string
}

/** Toggle show/hide password using the project eye icon. */
export default function PasswordVisibilityToggle({
  visible,
  onToggle,
  disabled = false,
  labelledBy
}: Props): JSX.Element {
  return (
    <button
      type="button"
      className="password-eye-toggle"
      onClick={onToggle}
      disabled={disabled}
      aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
      aria-pressed={visible}
      aria-controls={labelledBy}
      data-testid="password-visibility-toggle"
    >
      <img
        src={passwordEye}
        alt=""
        width={22}
        height={22}
        className={visible ? 'password-eye-icon is-visible' : 'password-eye-icon'}
      />
    </button>
  )
}
