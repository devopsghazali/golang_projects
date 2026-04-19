import { motion } from 'motion/react'
import { Network } from 'lucide-react'
import { networks } from '../data/networks'

export default function NetworksSection() {
  return (
    <section className="mt-16 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl text-center will-change-transform-opacity"
      >
        <span className="chip mx-auto">
          <Network size={12} className="text-violet-500" />
          <span>CPA networks we work with</span>
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Premium networks.{' '}
          <span className="text-gradient-brand">Proven offers.</span>
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
          The CPA MASTERY curriculum shows you how to pick the right offer
          across the networks that actually pay — and how to scale once one
          starts converting.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {networks.map((network, index) => (
          <motion.article
            key={network.id}
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              delay: 0.09 * index,
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -4, scale: 1.01 }}
            className="glass-panel group relative overflow-hidden rounded-[26px] p-5 transition-shadow hover:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)]"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${network.accent} opacity-80`}
            />
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_18px_40px_-22px_rgba(15,23,42,0.8)] ring-1 ring-black/5 dark:bg-white/95">
              <img
                src={network.logo}
                alt={`${network.name} logo`}
                loading="lazy"
                className="h-full w-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.parentElement.innerHTML = `<span class="text-[15px] font-bold tracking-tight text-slate-900">${network.name
                    .slice(0, 2)
                    .toUpperCase()}</span>`
                }}
              />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
              {network.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {network.tagline}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
