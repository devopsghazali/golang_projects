import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { BadgeCheck } from 'lucide-react'
import { fetchRecentBuyers } from '../lib/payment'

const INITIAL_DELAY_MS = 4000   // first popup after 4s
const VISIBLE_MS = 6000         // show each popup for 6s
const GAP_MS = 50000            // 50s gap between popups

export default function RecentBuyersPopup() {
  const [buyers, setBuyers] = useState([])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const data = await fetchRecentBuyers()
        if (mounted && Array.isArray(data) && data.length > 0) {
          setBuyers(data)
        }
      } catch {
        if (mounted) setBuyers([])
      }
    }
    load()
    const refresh = window.setInterval(load, 120000)
    return () => {
      mounted = false
      window.clearInterval(refresh)
    }
  }, [])

  useEffect(() => {
    if (buyers.length === 0) return undefined

    let showTimer = 0
    let hideTimer = 0

    const showNext = () => {
      setVisible(true)
      hideTimer = window.setTimeout(() => {
        setVisible(false)
        setIndex((current) => (current + 1) % buyers.length)
        showTimer = window.setTimeout(showNext, GAP_MS)
      }, VISIBLE_MS)
    }

    showTimer = window.setTimeout(showNext, INITIAL_DELAY_MS)

    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [buyers])

  if (buyers.length === 0) return null

  const buyer = buyers[index]

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-5">
      <AnimatePresence mode="wait">
        {visible && (
        <motion.div
          key={`${buyer.name}-${buyer.course}-${index}`}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-full border border-emerald-500/20 bg-white/90 px-3.5 py-2 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] backdrop-blur-md dark:border-emerald-400/20 dark:bg-slate-950/80 sm:max-w-md sm:px-4"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
            <BadgeCheck size={13} />
          </span>
          <div className="min-w-0 text-left">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
              Recent Verified Buyer
            </div>
            <p className="truncate text-[12.5px] leading-5 text-slate-700 dark:text-slate-200 sm:text-[13px]">
              <span className="font-semibold text-slate-950 dark:text-white">{buyer.name}</span>{' '}
              from {buyer.city} joined{' '}
              <span className="font-semibold text-slate-950 dark:text-white">{buyer.course}</span>
              {buyer.relativeTime && (
                <span className="text-slate-500 dark:text-slate-400"> · {buyer.relativeTime}</span>
              )}
            </p>
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
