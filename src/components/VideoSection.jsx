import { motion, useReducedMotion } from 'motion/react'
import { Play, Clock, Eye } from 'lucide-react'
import { featuredVideo } from '../data/video'

const revealVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function VideoSection() {
  const reduce = useReducedMotion()
  const { id, title, duration, views } = featuredVideo

  return (
    <motion.section
      variants={revealVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2, margin: '0px 0px -10% 0px' }}
      className="mt-10 w-full will-change-transform-opacity"
    >
      <div className="group relative">
        <div className="pointer-events-none absolute -inset-[1px] rounded-[22px] bg-gradient-to-br from-brand-blue/60 via-brand-cyan/40 to-brand-purple/60 opacity-60 blur-[2px] transition-opacity duration-500 group-hover:opacity-100" />

        <motion.div
          whileHover={reduce ? undefined : { y: -4 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="glass-panel relative overflow-hidden rounded-[22px] p-3"
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900">
            {id ? (
              <iframe
                src={`https://www.youtube.com/embed/${id}?rel=0`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 30% 30%, rgba(37,99,235,0.35), transparent 55%), radial-gradient(circle at 75% 65%, rgba(6,182,212,0.28), transparent 55%)',
                  }}
                />
                <div className="dot-grid absolute inset-0 opacity-30" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    type="button"
                    whileHover={reduce ? undefined : { scale: 1.06 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink-900 shadow-[0_12px_40px_-8px_rgba(37,99,235,0.6)] sm:h-20 sm:w-20"
                    aria-label="Play featured video (coming soon)"
                  >
                    <span className="pulse-ring bg-white/25" />
                    <span className="pulse-ring bg-white/15 [animation-delay:0.6s]" />
                    <Play
                      size={26}
                      strokeWidth={2.4}
                      className="relative translate-x-[2px] fill-ink-900"
                    />
                  </motion.button>
                </div>

                <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <Clock size={11} />
                  <span>{duration}</span>
                </div>
                <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  <Eye size={11} />
                  <span>{views}</span>
                </div>

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
                  <div className="min-w-0">
                    <div className="mt-1 line-clamp-2 text-sm font-semibold text-white sm:text-[15px]">
                      {title}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {!id && (
            <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-500">
              <span className="font-medium">
                Add your YouTube video ID in{' '}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                  src/data/video.js
                </code>
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.section>
  )
}
