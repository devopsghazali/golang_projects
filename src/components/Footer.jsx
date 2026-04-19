import { motion } from 'motion/react'
import { Heart } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
}

export default function Footer() {
  return (
    <motion.footer
      variants={itemVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="mt-12 flex flex-col items-center gap-1.5 pb-10 text-center text-xs text-slate-500 dark:text-slate-500"
    >
      <div className="flex items-center gap-2.5">
        <span className="h-px w-10 bg-gradient-to-r from-transparent to-slate-300 dark:to-slate-700" />
        <span className="font-medium tracking-wide">
          © 2026 cpamaster
        </span>
        <span className="h-px w-10 bg-gradient-to-l from-transparent to-slate-300 dark:to-slate-700" />
      </div>
      <span className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-600">
        Built with <Heart size={11} className="fill-rose-500 text-rose-500" /> · Trust first, scale second
      </span>
    </motion.footer>
  )
}
