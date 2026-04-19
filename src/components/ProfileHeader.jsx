import { motion } from 'motion/react'

const itemVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function ProfileHeader() {
  return (
    <section className="relative flex flex-col items-start text-left">
      <motion.div
        variants={itemVariants}
        className="relative mb-6 will-change-transform-opacity"
      >
        <motion.div
          aria-hidden
          className="absolute -inset-4 rounded-full bg-gradient-to-br from-brand-blue/35 via-brand-cyan/20 to-brand-purple/30 blur-2xl"
          animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="glass-card glass-card-lift relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[22px] ring-1 ring-black/5 dark:ring-white/10 sm:h-24 sm:w-24">
          <img
            src="/logo.svg"
            alt="cpamaster logo"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="font-display text-[2.2rem] font-bold uppercase leading-[1.02] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[2.7rem] lg:text-[3rem]"
      >
        cpa<span className="text-gradient-brand">master</span>
      </motion.h1>
    </section>
  )
}
