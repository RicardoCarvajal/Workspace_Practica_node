interface Props {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

/** Animated spinner for indexing / long-running actions. */
export default function LoadingSpinner({
  label,
  size = 'md'
}: Props): JSX.Element {
  return (
    <div className={`loading-spinner loading-spinner-${size}`} role="status" aria-live="polite">
      <span className="loading-spinner-ring" aria-hidden="true" />
      {label ? <span className="loading-spinner-label">{label}</span> : null}
    </div>
  )
}
