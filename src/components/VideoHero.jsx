import { useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Play } from 'lucide-react'

const VIDEO_URL =
  'https://res.cloudinary.com/di6hn9fwh/video/upload/v1776655695/lv_0_20260419215035_lsnfbh.mp4'
const POSTER_URL =
  'https://res.cloudinary.com/di6hn9fwh/video/upload/so_1.5,w_1280,q_auto,f_jpg/v1776655695/lv_0_20260419215035_lsnfbh.jpg'

export default function VideoHero() {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef(null)
  const reduce = useReducedMotion()

  const handlePlay = () => {
    setPlaying(true)
    requestAnimationFrame(() => {
      const el = videoRef.current
      if (!el) return
      el.muted = false
      const p = el.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          el.muted = true
          el.play().catch(() => {})
        })
      }
    })
  }

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18, scale: 0.98 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_30px_70px_-30px_rgba(15,23,42,0.55)] dark:shadow-[0_30px_70px_-30px_rgba(0,0,0,0.7)] sm:mb-8"
    >
      <div className="pointer-events-none absolute -inset-20 -z-10 bg-gradient-to-br from-brand-blue/30 via-brand-purple/25 to-brand-cyan/30 blur-3xl" aria-hidden />

      <div className="relative aspect-video w-full">
        {!playing && (
          <>
            <img
              src={POSTER_URL}
              alt="CPA Master intro preview"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
            <button
              type="button"
              onClick={handlePlay}
              aria-label="Play intro video"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-full bg-white/25 ${
                    reduce ? '' : 'animate-ping'
                  }`}
                />
                <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20">
                  <Play size={28} className="translate-x-[2px]" fill="currentColor" />
                </span>
              </span>
            </button>
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3 text-white sm:bottom-4 sm:left-5 sm:right-5">
              <div className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] backdrop-blur-md">
                Watch Intro
              </div>
              <div className="text-[11px] font-medium text-white/80">
                Tap to play
              </div>
            </div>
          </>
        )}

        {playing && (
          <video
            ref={videoRef}
            src={VIDEO_URL}
            poster={POSTER_URL}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            controls
            autoPlay
            playsInline
            preload="auto"
          />
        )}
      </div>
    </motion.div>
  )
}
