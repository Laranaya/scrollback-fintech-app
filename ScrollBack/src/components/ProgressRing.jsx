import { ringTone } from '../lib/selectors.js'

const RADIUS = 62
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export default function ProgressRing({ minutes, limit }) {
  const tone = ringTone(minutes, limit)
  const fraction = Math.min(1, minutes / limit)
  const left = limit - minutes
  const label =
    left >= 0
      ? `${minutes} of ${limit} minutes used, ${left} remaining`
      : `${minutes} of ${limit} minutes used, ${-left} over the limit`

  return (
    <div className={`ring ring--${tone}`} role="img" aria-label={label}>
      <svg viewBox="0 0 160 160" width="100%" height="100%">
        <circle className="ring__track" cx="80" cy="80" r={RADIUS} fill="none" strokeWidth="12" />
        <circle
          className="ring__value"
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="ring__label" aria-hidden="true">
        <span className="ring__minutes">{minutes}</span>
        <span className="ring__of">of {limit} min</span>
      </div>
    </div>
  )
}
