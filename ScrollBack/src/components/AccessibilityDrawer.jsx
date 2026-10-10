import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Eye, X, Volume2, VolumeX } from 'lucide-react'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function SwitchRow({ label, description, checked, onToggle }) {
  return (
    <button type="button" className={`access-switch${checked ? ' is-on' : ''}`} role="switch" aria-checked={checked} onClick={onToggle}>
      <span className="access-switch__copy">
        <span className="access-switch__label">{label}</span>
        <span className="access-switch__desc">{description}</span>
      </span>
      <span className="access-switch__rail" aria-hidden="true">
        <span className="access-switch__thumb" />
      </span>
      <span className="access-switch__state" aria-hidden="true">
        {checked ? 'On' : 'Off'}
      </span>
    </button>
  )
}

export default function AccessibilityDrawer({
  open,
  onClose,
  account,
  reducedMotion,
  highLegibility,
  onToggleReducedMotion,
  onToggleHighLegibility,
}) {
  const drawerRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const [speaking, setSpeaking] = useState(false)
  const titleId = useId()
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    const drawer = drawerRef.current
    const preferred = drawer.querySelector('[data-autofocus]') || drawer.querySelector(FOCUSABLE) || drawer
    preferred?.focus?.()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = [...drawer.querySelectorAll(FOCUSABLE)]
      if (nodes.length === 0) return
      const first = nodes[0]
      const lastNode = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        lastNode.focus()
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus?.()
    }
  }, [open])

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel?.()
    }
  }, [])

  if (!open) return null

  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  function cancelSpeech() {
    window.speechSynthesis?.cancel?.()
    setSpeaking(false)
  }

  function readAloud() {
    if (!canSpeak) return
    cancelSpeech()
    const text = `You have scrolled ${account.today.totalMinutes} minutes today. ${account.balances.vault.toFixed(2)} pounds are currently locked in your Vault. Complete your learning goal to unlock today's slice.`
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return createPortal(
    <div className="access-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside
        ref={drawerRef}
        className="access-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="access-drawer__head">
          <div className="access-drawer__titlewrap">
            <span className="access-drawer__icon" aria-hidden="true">
              <Eye size={18} />
            </span>
            <div>
              <h2 id={titleId} className="access-drawer__title">
                Accessibility
              </h2>
              <p className="access-drawer__lede">Tweak motion, legibility, and spoken feedback without changing your settings.</p>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close accessibility panel">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="access-drawer__body">
          <SwitchRow
            label="Reduced motion / calm view"
            description="Stops animated stars, glows, and motion-heavy transitions."
            checked={reducedMotion}
            onToggle={onToggleReducedMotion}
          />
          <SwitchRow
            label="High-legibility font"
            description="Uses a cleaner sans-serif heading style with more spacing."
            checked={highLegibility}
            onToggle={onToggleHighLegibility}
          />

          <section className="access-audio">
            <div className="access-audio__head">
              <div>
                <h3 className="access-audio__title">Screen reader audio</h3>
                <p className="access-audio__desc">Have the app read out today&apos;s scrolling and locked funds.</p>
              </div>
              <span className="access-audio__badge">Native voice</span>
            </div>
            <div className="access-audio__actions">
              <button type="button" className="btn btn--gold btn--block" onClick={readAloud} disabled={!canSpeak || speaking}>
                <Volume2 size={18} aria-hidden="true" />
                Read aloud
              </button>
              <button type="button" className="btn btn--outline btn--block" onClick={cancelSpeech} disabled={!canSpeak || !speaking}>
                <VolumeX size={18} aria-hidden="true" />
                Cancel speech
              </button>
            </div>
            {!canSpeak ? <p className="access-audio__note">Speech synthesis is not available in this browser.</p> : null}
            {speaking ? <p className="access-audio__note" role="status">Reading aloud now.</p> : null}
          </section>
        </div>
      </aside>
    </div>,
    document.body,
  )
}