import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useApp } from '../state/AppContext.jsx'
import { formatGBP } from '../lib/format.js'

const LABELS = { main: 'Main', vault: 'Vault', future: 'Future Me' }
const COIN_COUNT = 9

function anchorPoint(key, fallback) {
  const el = document.querySelector(`[data-balance="${key}"]`)
  if (!el) return fallback
  const r = el.getBoundingClientRect()
  return {
    x: Math.min(Math.max(r.left + r.width / 2, 24), window.innerWidth - 24),
    y: Math.min(Math.max(r.top + r.height / 2, 60), window.innerHeight - 60),
  }
}

// Gold coins fly between balance cards whenever money moves. Falls back to screen centre on
// pages that don't show the balance cards.
export default function CoinTransfer() {
  const { coinFx, clearCoinFx } = useApp()
  const [flight, setFlight] = useState(null)

  useEffect(() => {
    if (!coinFx) return undefined
    const vw = window.innerWidth
    const vh = window.innerHeight
    const fallback = {
      main: { x: vw / 2, y: vh * 0.3 },
      vault: { x: vw / 2, y: vh * 0.6 },
      future: { x: vw / 2, y: vh * 0.65 },
    }
    const from = anchorPoint(coinFx.from, fallback[coinFx.from])
    const to = anchorPoint(coinFx.to, fallback[coinFx.to])
    setFlight({ ...coinFx, fromPoint: from, toPoint: to })
    const timer = setTimeout(() => {
      setFlight(null)
      clearCoinFx(coinFx.id)
    }, 1900)
    return () => clearTimeout(timer)
  }, [coinFx, clearCoinFx])

  if (!flight) return null
  const { fromPoint: a, toPoint: b } = flight
  const midX = (a.x + b.x) / 2
  const midY = Math.min(a.y, b.y) - 70

  return (
    <div className="coin-layer" aria-hidden="true">
      {Array.from({ length: COIN_COUNT }, (_, i) => (
        <span
          key={`${flight.id}-${i}`}
          className="coin"
          style={{
            '--fx': `${a.x + (i % 3) * 8 - 8}px`,
            '--fy': `${a.y}px`,
            '--mx': `${midX + (i - COIN_COUNT / 2) * 9}px`,
            '--my': `${midY - (i % 3) * 14}px`,
            '--tx': `${b.x + (i % 3) * 6 - 6}px`,
            '--ty': `${b.y}px`,
            '--delay': `${i * 80}ms`,
          }}
        >
          £
        </span>
      ))}
      {flight.amount ? (
        <div className="coin-pill">
          <strong>{formatGBP(flight.amount)}</strong>
          <span>{LABELS[flight.from]}</span>
          <ArrowRight size={14} />
          <span>{LABELS[flight.to]}</span>
        </div>
      ) : null}
    </div>
  )
}
