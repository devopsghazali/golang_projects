import { motion } from 'motion/react'
import { ArrowUpRight, Send, Users } from 'lucide-react'

function InstagramGlyph({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  )
}

const channels = [
  {
    label: 'Join Telegram',
    href: 'https://t.me/MkArmy01',
    icon: Send,
    bg: 'linear-gradient(120deg,#0ea5e9,#2563eb)',
  },
  {
    label: 'Follow Instagram',
    href: 'https://www.instagram.com/the_mkbhai?igsh=MWlkZHNhb2UwMnI0Mg==',
    icon: InstagramGlyph,
    bg: 'linear-gradient(120deg,#f43f5e,#a855f7 55%,#f59e0b)',
  },
]

export default function CommunityCta() {
  return (
    <section className="mt-16 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel relative overflow-hidden rounded-[32px] p-8 text-center will-change-transform-opacity sm:p-12"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
        <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <span className="chip mx-auto">
            <Users size={12} className="text-cyan-500" />
            <span>Community</span>
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Join Our Growing{' '}
            <span className="text-gradient-brand">CPA Community</span>
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[15px]">
            Daily updates, live earning screenshots, and direct answers from
            mentors — all inside our free Telegram and Instagram channels.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {channels.map(({ label, href, icon: Icon, bg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_50px_-24px_rgba(15,23,42,0.75)] transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: bg }}
              >
                <Icon size={16} />
                <span>{label}</span>
                <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
