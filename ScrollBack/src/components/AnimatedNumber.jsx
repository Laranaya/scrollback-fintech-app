import { useEffect, useRef, useState } from 'react'
import { formatGBP } from '../lib/format.js'

export default function AnimatedNumber({ value, format = formatGBP, duration = 800 }) {
  const [display, setDisplay] = useState(value)
  const current = useRef(value)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = current.current
    if (reduce || from === value) {
      current.current = value
      setDisplay(value)
      return undefined
    }
    const start = performance.now()
    let raf = 0
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      current.current = p === 1 ? value : from + (value - from) * eased
      setDisplay(current.current)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span>{format(display)}</span>
}
