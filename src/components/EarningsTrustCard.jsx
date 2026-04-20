import { motion } from 'motion/react'
import { Rocket, ShieldCheck, Zap } from 'lucide-react'

const pillars = [
  { icon: Zap, label: 'Same-day setup', tone: 'text-amber-500' },
  { icon: Rocket, label: 'First payout possible in 24 hrs', tone: 'text-cyan-500' },
  { icon: ShieldCheck, label: 'Verified student results', tone: 'text-emerald-500' },
]

export default function EarningsTrustCard() {
  return (
    <section className="mt-16 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl overflow-hidden rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-cyan-500/6 to-blue-500/8 p-6 shadow-[0_30px_80px_-30px_rgba(16,185,129,0.35)] dark:border-emerald-400/20 sm:p-8"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

        <div className="flex flex-col items-center text-center">
          <span className="chip">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Proven outcome</span>
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[38px]">
            Earnings from{' '}
            <span className="text-gradient-brand">First Day</span>
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            Finish the setup and start seeing approved conversions from day one — no waiting, no long ramp-up.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.label}
              className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-slate-900/5 dark:bg-white/5 dark:ring-white/10"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900/5 dark:bg-white/10 ${pillar.tone}`}>
                <pillar.icon size={16} strokeWidth={2.3} />
              </span>
              <span className="text-[13px] font-semibold leading-tight text-slate-800 dark:text-slate-100">
                {pillar.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
