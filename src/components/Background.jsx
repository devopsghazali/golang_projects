import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 767px)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

const orbs = [
  { size: 520, startX: -140, startY: -160, color: 'rgba(139, 92, 246, 0.42)', dur: 28, dir: 1 },
  { size: 420, startX: null, startY: 60, right: -160, color: 'rgba(59, 130, 246, 0.32)', dur: 34, dir: -1 },
  { size: 360, startX: 120, startY: null, bottom: -120, color: 'rgba(6, 182, 212, 0.28)', dur: 38, dir: 1 },
  { size: 300, startX: null, startY: null, right: -80, bottom: -60, color: 'rgba(236, 72, 153, 0.22)', dur: 42, dir: -1 },
]

const floaters = [
  { size: 8, left: '12%', top: '18%', color: '#a78bfa', dur: 7 },
  { size: 5, left: '78%', top: '22%', color: '#60a5fa', dur: 9 },
  { size: 6, left: '22%', top: '68%', color: '#22d3ee', dur: 8 },
  { size: 4, left: '68%', top: '74%', color: '#f472b6', dur: 11 },
  { size: 7, left: '48%', top: '38%', color: '#34d399', dur: 10 },
  { size: 5, left: '88%', top: '52%', color: '#fbbf24', dur: 12 },
]

const springConfig = { stiffness: 60, damping: 20, mass: 0.6 }

export default function Background() {
  const reduce = useReducedMotion()
  const isMobile = useIsMobile()
  const ref = useRef(null)
  const { scrollY } = useScroll()

  const rawY1 = useTransform(scrollY, [0, 1600], [0, -180])
  const rawY2 = useTransform(scrollY, [0, 1600], [0, 240])
  const rawY3 = useTransform(scrollY, [0, 1600], [0, -90])
  const y1 = useSpring(rawY1, springConfig)
  const y2 = useSpring(rawY2, springConfig)
  const y3 = useSpring(rawY3, springConfig)

  const gridOpacity = useTransform(scrollY, [0, 600], [1, 0.55])

  useEffect(() => {
    if (reduce || isMobile) return
    const el = ref.current
    if (!el) return
    let raf = 0
    const onMove = (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2
        const y = (e.clientY / window.innerHeight - 0.5) * 2
        el.style.setProperty('--px', x.toFixed(3))
        el.style.setProperty('--py', y.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reduce, isMobile])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ '--px': 0, '--py': 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-grid-light mask-fade dark:hidden"
        style={{ opacity: gridOpacity }}
      />
      <motion.div
        className="absolute inset-0 hidden bg-grid-dark mask-fade dark:block"
        style={{ opacity: gridOpacity }}
      />

      <motion.div
        className="absolute inset-0 will-change-transform-opacity"
        style={isMobile ? undefined : { y: y1 }}
      >
        {(isMobile ? orbs.slice(0, 1) : orbs.slice(0, 2)).map((o, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: o.size,
              height: o.size,
              left: o.startX !== null ? o.startX : undefined,
              right: o.right,
              top: o.startY !== null ? o.startY : undefined,
              bottom: o.bottom,
              background: `radial-gradient(circle at center, ${o.color}, transparent 65%)`,
              translate: isMobile
                ? undefined
                : `calc(var(--px) * ${24 * o.dir}px) calc(var(--py) * ${16 * o.dir}px)`,
            }}
            animate={
              reduce || isMobile
                ? undefined
                : {
                    x: [0, 48 * o.dir, -24 * o.dir, 0],
                    y: [0, -30, 22, 0],
                    scale: [1, 1.09, 0.95, 1],
                  }
            }
            transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>

      {!isMobile && (
        <motion.div
          className="absolute inset-0 will-change-transform-opacity"
          style={{ y: y2 }}
        >
          {orbs.slice(2).map((o, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full blur-3xl"
              style={{
                width: o.size,
                height: o.size,
                left: o.startX !== null ? o.startX : undefined,
                right: o.right,
                top: o.startY !== null ? o.startY : undefined,
                bottom: o.bottom,
                background: `radial-gradient(circle at center, ${o.color}, transparent 65%)`,
                translate: `calc(var(--px) * ${18 * o.dir}px) calc(var(--py) * ${12 * o.dir}px)`,
              }}
              animate={
                reduce
                  ? undefined
                  : {
                      x: [0, -32 * o.dir, 20 * o.dir, 0],
                      y: [0, 24, -18, 0],
                      scale: [1, 1.07, 0.96, 1],
                    }
              }
              transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      )}

      {!reduce && !isMobile && (
        <motion.div
          className="absolute inset-0 will-change-transform-opacity"
          style={{ y: y3 }}
        >
          {floaters.map((f, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: f.size,
                height: f.size,
                left: f.left,
                top: f.top,
                background: f.color,
                boxShadow: `0 0 ${f.size * 3}px ${f.size / 2}px ${f.color}`,
                opacity: 0.55,
              }}
              animate={{
                y: [0, -22, 0, 18, 0],
                x: [0, 10, -6, 4, 0],
                opacity: [0.3, 0.75, 0.5, 0.75, 0.3],
                scale: [1, 1.12, 1, 1.08, 1],
              }}
              transition={{ duration: f.dur, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      )}

      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/60 to-transparent dark:from-ink-950/80" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-white/70 to-transparent dark:from-ink-950/90" />

      <div className="noise absolute inset-0" />
    </div>
  )
}
