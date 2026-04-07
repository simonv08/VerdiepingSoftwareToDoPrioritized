import { useMemo } from 'react'
import './BackgroundLines.css'

type LineSpec = {
  id: string
  leftPct: number
  widthPx: number
  heightVh: number
  opacity: number
  delayS: number
  durationS: number
  gradientClassName: string
}

export default function BackgroundLines() {
  const lines = useMemo<LineSpec[]>(() => {
    // Calm, theme-consistent tones (deep purple -> light pink).
    const gradients = [
      'bg-linear-to-b from-transparent via-purple-300/55 to-purple-300/55',
      'bg-linear-to-b from-transparent via-fuchsia-300/50 to-fuchsia-300/50',
      'bg-linear-to-b from-transparent via-pink-200/55 to-pink-200/55',
      'bg-linear-to-b from-transparent via-violet-300/50 to-violet-300/50',
      'bg-linear-to-b from-transparent via-fuchsia-400/45 to-fuchsia-400/45',
      'bg-linear-to-b from-transparent via-pink-300/45 to-pink-300/45',
      'bg-linear-to-b from-transparent via-purple-400/40 to-purple-400/40',
    ]

    const seed = (() => {
      try {
        const buf = new Uint32Array(1)
        crypto.getRandomValues(buf)
        return buf[0]!
      } catch {
        return Math.floor(Math.random() * 2 ** 32)
      }
    })()

    function mulberry32(a: number) {
      let t = a >>> 0
      return () => {
        t |= 0
        t = (t + 0x6d2b79f5) | 0
        let x = Math.imul(t ^ (t >>> 15), 1 | t)
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296
      }
    }

    const rand = mulberry32(seed)
    const count = 18 + Math.floor(rand() * 10) // more everywhere, still calm

    return Array.from({ length: count }).map((_, idx) => {
      const gradientClassName = gradients[Math.floor(rand() * gradients.length)]!

      const leftPct = rand() * 100
      // Slightly bigger streaks
      const widthPx = rand() < 0.7 ? 2 : rand() < 0.92 ? 3 : 4
      const heightVh = 14 + Math.floor(rand() * 20)
      const opacity = 0.18 + rand() * 0.28

      const baseDurationS = 7.5 + rand() * 7.5
      const durationS = baseDurationS * 1.5
      // negative delays start the animation mid-flight, so it feels random immediately
      const delayS = -(rand() * durationS)

      return {
        id: `line-${idx}`,
        leftPct,
        widthPx,
        heightVh,
        opacity,
        delayS,
        durationS,
        gradientClassName,
      }
    })
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 overflow-hidden">
        {lines.map((l) => (
          <div
            key={l.id}
            className="absolute top-0 h-full overflow-hidden"
            style={{
              left: `${l.leftPct}%`,
              width: `${l.widthPx}px`,
            }}
          >
            <div
              className={`bg-lines-drop absolute left-0 top-0 w-full ${l.gradientClassName}`}
              style={{
                height: `${l.heightVh}vh`,
                opacity: l.opacity,
                animationDelay: `${l.delayS}s`,
                animationDuration: `${l.durationS}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
