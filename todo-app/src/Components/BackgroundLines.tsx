import { useMemo } from 'react'
import './BackgroundLines.css'

type LineSpec = {
  id: string
  leftPct: number
  widthPx: number
  opacity: number
  delayS: number
  durationS: number
  driftXPx: number
  startXPx: number
  angleDeg: number
  segments: Array<{
    id: string
    yPx: number
    heightPx: number
    opacity: number
    blurPx: number
  }>
  headSizePx: number
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
      // Shooting-star feel: thinner trails
      const widthPx = rand() < 0.55 ? 1 : rand() < 0.92 ? 2 : 3
      const opacity = 0.22 + rand() * 0.34

      // Diagonal drift (shooting-star direction) — mirrored (moves left while falling)
      const driftXPx = -(220 + Math.floor(rand() * 520))
      const startXPx = -Math.floor(driftXPx * (0.22 + rand() * 0.12))

      // Straight path: pick one direction and keep it for the whole fall.
      // Approximate vertical travel in px so the diagonal angle feels consistent.
      const approxDyPx = 1100
      const dx = driftXPx - startXPx
      const angleDeg = (Math.atan2(-dx, approxDyPx) * 180) / Math.PI

      const segmentCount = 10 + Math.floor(rand() * 10)
      const segGapPx = 8 + Math.floor(rand() * 7)
      const headSizePx = 14 + Math.floor(rand() * 10)
      const segments = Array.from({ length: segmentCount }).map((_, segIdx) => {
        const t = (segIdx + 1) / (segmentCount + 1)
        const yPx = -(segIdx + 1) * segGapPx
        const heightPx = 10 + Math.floor((1 - t) * 18)
        const segOpacity = Math.max(0.06, (1 - t) ** 2) * 0.65
        const blurPx = 0.5 + t * 5.5
        return {
          id: `seg-${idx}-${segIdx}`,
          yPx,
          heightPx,
          opacity: segOpacity,
          blurPx,
        }
      })

      // Slower fall
      const baseDurationS = 8.5 + rand() * 7.5
      const durationS = baseDurationS
      // negative delays start the animation mid-flight, so it feels random immediately
      const delayS = -(rand() * durationS)

      return {
        id: `line-${idx}`,
        leftPct,
        widthPx,
        opacity,
        delayS,
        durationS,
        driftXPx,
        startXPx,
        angleDeg,
        segments,
        headSizePx,
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
            className="absolute top-0 h-full overflow-visible"
            style={{
              left: `${l.leftPct}%`,
              width: 0,
            }}
          >
            <div
              className="bg-star absolute left-0 top-0"
              style={{
                opacity: l.opacity,
                animationDelay: `${l.delayS}s`,
                animationDuration: `${l.durationS}s`,
                ['--bg-star-x0' as string]: `${l.startXPx}px`,
                ['--bg-star-x1' as string]: `${l.driftXPx}px`,
                ['--bg-star-angle' as string]: `${l.angleDeg}deg`,
              }}
            >
              <div className="bg-star-body">
                <div
                  className={`bg-star-head ${l.gradientClassName}`}
                  style={{
                    width: `${l.headSizePx}px`,
                    height: `${l.headSizePx}px`,
                  }}
                />

                {l.segments.map((s) => (
                  <div
                    key={s.id}
                    className={`bg-star-seg ${l.gradientClassName}`}
                    style={{
                      width: `${l.widthPx}px`,
                      height: `${s.heightPx}px`,
                      transform: `translate3d(-50%, ${s.yPx}px, 0)`,
                      opacity: s.opacity,
                      filter: `blur(${s.blurPx}px)`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
