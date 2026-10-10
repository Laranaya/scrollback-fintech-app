import { useEffect, useRef } from 'react'

// Twinkling stars with the occasional slow shooting star. Static when reduced motion is on.
export default function Starfield() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = 0
    let height = 0
    let stars = []
    let shooters = []
    let raf = 0
    let last = performance.now()
    let nextShooter = last + 2500
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersReduced = () => media.matches || document.body.classList.contains('reduce-motion')
    let reduce = prefersReduced()

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round((width * height) / 5500)
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.3 + 0.3,
        speed: 0.5 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        gold: Math.random() < 0.14,
      }))
    }

    function draw(now) {
      const dt = Math.min(64, now - last) / 1000
      last = now
      ctx.clearRect(0, 0, width, height)

      for (const s of stars) {
        const alpha = reduce ? 0.65 : 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((now / 1000) * s.speed + s.phase))
        ctx.fillStyle = s.gold ? `rgba(106,226,170,${alpha})` : `rgba(244,239,228,${alpha * 0.85})`
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      if (!reduce) {
        if (now > nextShooter && shooters.length < 2) {
          shooters.push({
            x: Math.random() * width * 0.7,
            y: Math.random() * height * 0.4,
            vx: 140 + Math.random() * 80,
            vy: 60 + Math.random() * 40,
            life: 0,
            max: 1.8 + Math.random() * 0.8,
          })
          nextShooter = now + 4000 + Math.random() * 5000
        }
        shooters = shooters.filter((s) => s.life < s.max)
        for (const s of shooters) {
          s.life += dt
          s.x += s.vx * dt
          s.y += s.vy * dt
          const fade = Math.sin((s.life / s.max) * Math.PI)
          const tail = 70
          const len = Math.hypot(s.vx, s.vy)
          const grad = ctx.createLinearGradient(s.x, s.y, s.x - (s.vx / len) * tail, s.y - (s.vy / len) * tail)
          grad.addColorStop(0, `rgba(106,226,170,${0.9 * fade})`)
          grad.addColorStop(1, 'rgba(106,226,170,0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(s.x, s.y)
          ctx.lineTo(s.x - (s.vx / len) * tail, s.y - (s.vy / len) * tail)
          ctx.stroke()
        }
        raf = requestAnimationFrame(draw)
      }
    }

    function drawStatic() {
      ctx.clearRect(0, 0, width, height)
      for (const s of stars) {
        ctx.fillStyle = s.gold ? 'rgba(106,226,170,0.65)' : 'rgba(244,239,228,0.55)'
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function syncMotion() {
      const next = prefersReduced()
      if (next === reduce) return
      reduce = next
      if (reduce) {
        cancelAnimationFrame(raf)
        raf = 0
        drawStatic()
      } else {
        last = performance.now()
        nextShooter = last + 2500
        raf = requestAnimationFrame(draw)
      }
    }

    resize()
    if (reduce) drawStatic()
    else raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    media.addEventListener?.('change', syncMotion)
    const observer = new MutationObserver(syncMotion)
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      media.removeEventListener?.('change', syncMotion)
      observer.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />
}
