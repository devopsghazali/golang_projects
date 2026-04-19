import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { BadgeCheck, CheckCircle2, Sparkles } from 'lucide-react'
import ApplyNowModal from './ApplyNowModal'

export default function CoursePurchaseCard({ course, index }) {
  const reduce = useReducedMotion()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 44, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{
          delay: 0.05 + index * 0.06,
          duration: 0.9,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={reduce ? undefined : { y: -5, scale: 1.005 }}
        className="group glass-panel relative overflow-hidden rounded-[30px] p-6 will-change-transform-opacity transition-shadow hover:shadow-[0_40px_100px_-30px_rgba(37,99,235,0.45)] sm:p-8"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-75 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at top right, ${course.glow} 0%, transparent 40%)`,
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white"
              style={{ background: course.iconBg }}
            >
              <BadgeCheck size={14} />
              {course.badge}
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              {course.name}
            </h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Price
            </div>
            <div className="mt-1 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {course.priceLabel}
            </div>
          </div>
        </div>

        {course.highlight && (
          <div className="relative mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-200">
            <Sparkles size={16} className="mt-0.5 shrink-0" />
            <span className="leading-6">{course.highlight}</span>
          </div>
        )}

        <ul className="relative mt-5 grid gap-2.5 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
          {course.learningPoints.map((point, idx) => (
            <motion.li
              key={point}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{
                delay: 0.25 + idx * 0.04,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex gap-2"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" />
              <span>{point}</span>
            </motion.li>
          ))}
        </ul>

        <motion.button
          type="button"
          onClick={() => setModalOpen(true)}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          className="relative mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white shadow-[0_24px_50px_-24px_rgba(37,99,235,0.75)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto sm:min-w-[220px]"
          style={{ background: course.fill }}
        >
          Join Now
        </motion.button>
      </motion.article>

      <ApplyNowModal
        course={course}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
