import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowRight, ChevronLeft, ChevronRight, TrendingUp, X } from 'lucide-react'
import { proofs } from '../data/proofs'

function ProofImage({ src, alt, priority }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div className="relative h-full w-full overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" />
      )}
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover object-top transition-all duration-500 group-hover:scale-[1.04] ${
          loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
        }`}
      />
    </div>
  )
}

export default function HorizontalProofStrip() {
  const reduce = useReducedMotion()
  const scrollerRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const [activeIndex, setActiveIndex] = useState(null)
  const [showSwipeHint, setShowSwipeHint] = useState(true)

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return undefined
    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      setCanLeft(scrollLeft > 4)
      setCanRight(scrollLeft + clientWidth < scrollWidth - 4)
      if (scrollLeft > 8) setShowSwipeHint(false)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    if (reduce) return undefined
    const el = scrollerRef.current
    if (!el) return undefined
    if (el.scrollWidth <= el.clientWidth + 4) return undefined

    const t1 = setTimeout(() => el.scrollTo({ left: 70, behavior: 'smooth' }), 1300)
    const t2 = setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 2100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [reduce])

  useEffect(() => {
    if (activeIndex === null) return undefined
    const handler = (event) => {
      if (event.key === 'Escape') setActiveIndex(null)
      if (event.key === 'ArrowRight') {
        setActiveIndex((i) => (i + 1) % proofs.length)
      }
      if (event.key === 'ArrowLeft') {
        setActiveIndex((i) => (i - 1 + proofs.length) % proofs.length)
      }
    }
    window.addEventListener('keydown', handler)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = prev
    }
  }, [activeIndex])

  const scrollBy = (direction) => {
    const el = scrollerRef.current
    if (!el) return
    const step = el.clientWidth * 0.85
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  const active = activeIndex !== null ? proofs[activeIndex] : null

  return (
    <section className="mt-16 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="chip mx-auto">
          <TrendingUp size={12} className="text-emerald-500" />
          <span>Real results, real students</span>
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Student Earning{' '}
          <span className="text-gradient-brand">Proofs</span>
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
          Our students are applying these strategies and generating real
          results. Swipe through verified earning screenshots below.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="relative mt-10"
      >
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur transition-opacity hover:bg-white disabled:cursor-not-allowed disabled:opacity-0 dark:bg-slate-900/90 dark:text-white dark:hover:bg-slate-900 sm:flex"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] backdrop-blur transition-opacity hover:bg-white disabled:cursor-not-allowed disabled:opacity-0 dark:bg-slate-900/90 dark:text-white dark:hover:bg-slate-900 sm:flex"
        >
          <ChevronRight size={20} />
        </button>

        <div
          ref={scrollerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {proofs.map((proof, index) => (
            <motion.button
              type="button"
              key={proof.id}
              onClick={() => setActiveIndex(index)}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                delay: Math.min(index, 8) * 0.06,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={reduce ? undefined : { y: -4, scale: 1.01 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
              className="group relative shrink-0 snap-start overflow-hidden rounded-[22px] bg-slate-900/5 outline-none ring-1 ring-black/5 transition-shadow hover:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.4)] focus-visible:ring-2 focus-visible:ring-cyan-400/60 dark:bg-slate-900/40 dark:ring-white/10"
              style={{ width: 'clamp(200px, 56vw, 280px)' }}
              aria-label={`Open ${proof.label}`}
            >
              <div className="aspect-[9/16] w-full">
                <ProofImage
                  src={proof.src}
                  alt={proof.label}
                  priority={index < 6}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                <span>Verified</span>
                <span>#{String(index + 1).padStart(2, '0')}</span>
              </div>
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {showSwipeHint && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none mt-3 flex justify-center sm:hidden"
              aria-hidden="true"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/85 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_-12px_rgba(15,23,42,0.5)] backdrop-blur dark:bg-white/10">
                <span>Swipe</span>
                <motion.span
                  animate={reduce ? undefined : { x: [0, 6, 0] }}
                  transition={reduce ? undefined : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex"
                >
                  <ArrowRight size={14} />
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm"
            onClick={() => setActiveIndex(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close preview"
            >
              <X size={20} />
            </button>
            <motion.img
              key={active.id}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              src={active.src}
              alt={active.label}
              className="max-h-[88vh] max-w-full rounded-3xl shadow-[0_60px_120px_-30px_rgba(15,23,42,0.9)]"
              onClick={(event) => event.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
