import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.tone] ?? Info
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.tone === 'error' ? 7000 : 5000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.tone, onDismiss])

  return (
    <div className={`toast toast--${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'}>
      <Icon className="toast__icon" size={20} aria-hidden="true" />
      <div className="toast__body">
        {toast.title ? <p className="toast__title">{toast.title}</p> : null}
        {toast.message ? <p className="toast__message">{toast.message}</p> : null}
      </div>
      <button type="button" className="icon-btn icon-btn--sm" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

export default function Toasts() {
  const { toasts, dismissToast } = useApp()
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
