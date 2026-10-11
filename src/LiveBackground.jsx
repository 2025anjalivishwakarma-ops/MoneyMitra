import { useEffect, useRef } from 'react'

// Soft, slow "living" version of a still photo:
// slow zoom and drift, shifting light rays, and a few floating motes.
export default function LiveBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 12,
      r: 1.2 + Math.random() * 2.8,
      vy: 0.07 + Math.random() * 0.2,
      vx: (Math.random() - 0.5) * 0.12,
      phase: Math.random() * Math.PI * 2,
      rgb: Math.random() < 0.5 ? '255,218,160' : '255,176,205',
      alpha: 0.16 + Math.random() * 0.26,
    })

    resize()
    window.addEventListener('resize', resize)
    const motes = Array.from({ length: 34 }, () => spawn(true))

    const tick = (t) => {
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < motes.length; i++) {
        const m = motes[i]
        m.x += m.vx + Math.sin(t * 0.0005 + m.phase) * 0.14
        m.y -= m.vy
        if (m.y < -12) motes[i] = spawn(false)
        const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r * 3)
        g.addColorStop(0, `rgba(${m.rgb},${m.alpha})`)
        g.addColorStop(1, `rgba(${m.rgb},0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" aria-hidden="true">
      <img
        src="/forest.jpg"
        alt=""
        className="bg-kenburns absolute inset-0 h-full w-full object-cover"
      />
      <div className="bg-rays pointer-events-none absolute -inset-[10%]" />
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      {/* keeps text readable and the motion subtle */}
      <div className="absolute inset-0 bg-black/60" />
    </div>
  )
}
