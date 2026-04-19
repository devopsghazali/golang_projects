import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function LinkCard({ link }) {
  const { number, title, subtitle, href, internal, icon: Icon, fill, iconBg, glow } = link
  const [filling, setFilling] = useState(false)
  const [hover, setHover] = useState(false)
  const reduce = useReducedMotion()
  const navigate = useNavigate()

  const go = () => {
    if (!href || href === '#') return
    if (internal) {
      navigate(href)
      return
    }
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const handleActivate = () => {
    if (filling) return
    if (reduce) {
      go()
      return
    }
    setFilling(true)
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleActivate()
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={reduce ? undefined : { y: -3 }}
      whileTap={reduce ? undefined : { scale: 0.988 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      role="link"
      tabIndex={0}
      aria-label={internal ? `${title} - opens internal page` : `${title} - opens in a new tab`}
      onClick={handleActivate}
      onKeyDown={onKeyDown}
      style={{
        '--gleam-color': glow,
        boxShadow: hover && !filling ? `0 18px 50px -20px ${glow}` : undefined,
      }}
      className="border-gleam glass-card group relative flex cursor-pointer items-stretch gap-3 overflow-hidden rounded-2xl p-3 outline-none transition-[box-shadow] duration-300 sm:gap-4 sm:p-3.5"
    >
      <motion.span
        aria-hidden
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: filling ? 'inset(0 0% 0 0)' : 'inset(0 100% 0 0)' }}
        transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => {
          if (filling) {
            go()
            setFilling(false)
          }
        }}
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: fill }}
      />

      <span className="pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <span className="shine-sweep absolute inset-0" />
      </span>

      <span
        aria-hidden
        className={`relative z-10 flex w-8 shrink-0 select-none items-center justify-center font-mono text-[10.5px] font-semibold tracking-widest transition-colors sm:w-9 sm:text-[11px] ${
          filling ? 'text-white/85' : 'text-slate-400 dark:text-slate-600'
        }`}
      >
        {number}
      </span>

      <motion.span
        className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-inner sm:h-12 sm:w-12"
        style={{
          background: iconBg,
          boxShadow: hover && !filling
            ? `0 10px 30px -6px ${glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
            : 'inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
        animate={
          reduce
            ? undefined
            : hover && !filling
              ? { scale: 1.05, rotate: -3 }
              : { scale: 1, rotate: 0 }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </motion.span>

      <span className="relative z-10 flex min-w-0 flex-1 flex-col justify-center text-left">
        <span
          className={`truncate text-[15px] font-semibold leading-tight tracking-tight transition-colors sm:text-[15.5px] ${
            filling ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}
        >
          {title}
        </span>
        {subtitle && (
          <span
            className={`mt-0.5 truncate text-[11.5px] transition-colors sm:text-[12px] ${
              filling ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {subtitle}
          </span>
        )}
        <span className="mt-1.5 h-px w-full overflow-hidden rounded-full bg-slate-200/0 dark:bg-white/0">
          <motion.span
            className="block h-full origin-left rounded-full"
            style={{ background: iconBg }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={
              hover && !filling
                ? { scaleX: 1, opacity: 0.75 }
                : { scaleX: 0, opacity: 0 }
            }
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </span>

      <motion.span
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-full transition-colors ${
          filling
            ? 'bg-white/20 text-white'
            : 'bg-slate-900/5 text-slate-600 group-hover:bg-slate-900/10 group-hover:text-slate-800 dark:bg-white/5 dark:text-slate-300 dark:group-hover:bg-white/10 dark:group-hover:text-white'
        }`}
        animate={
          reduce
            ? undefined
            : hover && !filling
              ? { x: 4, y: -4, rotate: 4 }
              : filling
                ? { x: 6, y: -6, rotate: 6 }
                : { x: 0, y: 0, rotate: 0 }
        }
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      >
        <ArrowUpRight size={15} strokeWidth={2.4} />
      </motion.span>
    </motion.div>
  )
}
