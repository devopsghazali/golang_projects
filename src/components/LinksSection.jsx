import { motion } from 'motion/react'
import LinkCard from './LinkCard'
import { links } from '../data/links'

const groupVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.09, delayChildren: 0.08 },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function LinksSection() {
  return (
    <motion.section
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.1, margin: '0px 0px -8% 0px' }}
      aria-label="Primary links"
      className="w-full"
    >
      <motion.header
        variants={headerVariants}
        className="mb-5 flex items-end justify-between gap-4 will-change-transform-opacity"
      >
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-slate-400 dark:to-slate-500" />
            Start here
          </div>
          <h2 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-[1.75rem]">
            Premium entry points for the{' '}
            <span className="text-gradient-brand">cpamaster ecosystem.</span>
          </h2>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            Join the course, study the proof, and step into a trust-led funnel.
          </p>
        </div>
      </motion.header>

      <motion.nav
        variants={groupVariants}
        className="flex flex-col gap-3 sm:gap-3.5"
      >
        {links.map((link) => (
          <LinkCard key={link.id} link={link} />
        ))}
      </motion.nav>
    </motion.section>
  )
}
