import { AlertCircle, Loader2 } from 'lucide-react'

export function Spinner({ size = 20 }) {
  return <Loader2 className="spin" size={size} aria-hidden="true" />
}

export function LoadingState({ message = 'Loading\u2026', fullScreen = false }) {
  return (
    <div className={`state${fullScreen ? ' state--full' : ''}`} role="status" aria-live="polite">
      <Spinner size={28} />
      <p className="state__text">{message}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="state state--empty">
      {Icon ? (
        <span className="state__icon">
          <Icon size={22} aria-hidden="true" />
        </span>
      ) : null}
      <h3 className="state__title">{title}</h3>
      {message ? <p className="state__text">{message}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, fullScreen = false }) {
  return (
    <div className={`state state--error${fullScreen ? ' state--full' : ''}`} role="alert">
      <span className="state__icon state__icon--error">
        <AlertCircle size={22} aria-hidden="true" />
      </span>
      <h3 className="state__title">{title}</h3>
      <p className="state__text">{message || 'We couldn\u2019t load your data. Please try again.'}</p>
      {onRetry ? (
        <button type="button" className="btn btn--outline btn--sm" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function Skeleton({ height = 16, width = '100%', radius = 8 }) {
  return <span className="skeleton" style={{ height, width, borderRadius: radius }} aria-hidden="true" />
}
