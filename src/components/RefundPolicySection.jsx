import { motion } from 'motion/react'
import { FileText, ShieldAlert } from 'lucide-react'

const clauses = [
  {
    title: 'No Refund (basic rule)',
    body:
      'Jab koi banda course ya product khareed lega to usko paisa wapas nahi milega. Content digital hai (Drive link / course) aur payment ke baad instantly access mil jata hai.',
  },
  {
    title: 'Kab refund mil sakta hai (rare cases)',
    body:
      'Sirf 3 situations me: (1) 2 baar payment ho gaya ho (duplicate), (2) paisa cut ho gaya lekin access nahi mila, (3) payment ho gaya lekin order system me save nahi hua. In cases me support ko 24\u201348 hours ke andar contact karna hoga.',
  },
  {
    title: 'Support',
    body:
      'Agar koi problem ho (payment issue ya access issue), to support se contact karo \u2014 Email: kaif85725@gmail.com ya YouTube channel: https://www.youtube.com/@themkbhai par message karo.',
  },
  {
    title: 'Policy change',
    body:
      'Future me rules change ho sakte hain. Bina notice ke bhi update ho sakta hai.',
  },
]

export default function RefundPolicySection() {
  return (
    <section id="refund-policy" className="mt-16 scroll-mt-20 sm:mt-20">
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="chip mx-auto">
          <ShieldAlert size={12} className="text-rose-500" />
          <span>Refund & Cancellation Policy</span>
        </span>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Transparent policy.{' '}
          <span className="text-gradient-brand">No hidden surprises.</span>
        </h2>
      </motion.div>

      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto mt-10 max-w-3xl"
      >
        <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-br from-amber-200/40 via-rose-200/30 to-amber-200/40 blur-2xl dark:from-amber-400/10 dark:via-rose-400/10 dark:to-amber-400/10" />

        <div
          className="relative overflow-hidden rounded-[28px] bg-[#fdfaf3] p-7 shadow-[0_40px_100px_-30px_rgba(120,80,20,0.35)] ring-1 ring-amber-900/10 dark:bg-[#1a1812] dark:ring-amber-100/10 sm:p-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(transparent 0 38px, rgba(120, 80, 20, 0.08) 38px 39px)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400/0 via-amber-500/70 to-amber-400/0" />
          <div className="absolute left-12 top-0 h-full w-px bg-rose-400/40" />

          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-amber-300 dark:bg-amber-300 dark:text-slate-950">
              <FileText size={18} />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-amber-200/80">
                Official Document
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-amber-50 sm:text-[28px]">
                CPAMASTER — Refund & Cancellation Policy
              </h3>
              <div className="mt-1 text-[12px] text-slate-500 dark:text-amber-100/60">
                Effective from the date of purchase. Governed by Indian law.
              </div>
            </div>
          </div>

          <ol className="relative mt-7 space-y-5 pl-2">
            {clauses.map((clause, index) => (
              <motion.li
                key={clause.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  delay: 0.06 * index,
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex gap-4"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 font-display text-sm font-bold text-slate-950 ring-1 ring-amber-800/20 dark:bg-amber-200/20 dark:text-amber-100">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-display text-[15px] font-bold uppercase tracking-[0.08em] text-slate-900 dark:text-amber-100">
                    {clause.title}
                  </div>
                  <p className="mt-1 text-[14px] leading-7 text-slate-700 dark:text-amber-50/85">
                    {clause.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>

          <div className="relative mt-8 flex flex-wrap items-end justify-between gap-3 border-t border-amber-800/20 pt-5 text-[12px] text-slate-600 dark:border-amber-200/15 dark:text-amber-100/70">
            <div>
              <div className="font-semibold text-slate-900 dark:text-amber-50">
                CPAMASTER
              </div>
              <div>kaif85725@gmail.com</div>
              <div>youtube.com/@themkbhai</div>
            </div>
            <div className="font-display italic text-slate-900 dark:text-amber-100">
              — Authorised Signatory
            </div>
          </div>
        </div>
      </motion.article>
    </section>
  )
}
