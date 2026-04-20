import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Flame, X } from 'lucide-react'
import { validateCoupon, formatRupees } from '../lib/coupon'
import { isPlaceholderMode } from '../lib/config'
import { primaryCourse } from '../data/courses'

// Shows a live server-validated promo for a featured coupon code.
// If the code is expired / exhausted / inactive, banner silently hides.
// Configurable via VITE_FEATURED_COUPON.
const FEATURED_COUPON = import.meta.env.VITE_FEATURED_COUPON || ''
const DISMISS_KEY = 'cpamaster-promo-dismissed'
const DISMISS_WINDOW_MS = 1000 * 60 * 60 * 12 // 12 hours

function shouldShowAgain() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return true
    const at = Number(raw)
    if (!Number.isFinite(at)) return true
    return Date.now() - at > DISMISS_WINDOW_MS
  } catch {
    return true
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  return `${minutes}m ${seconds}s`
}

export default function CouponPromoBanner() {
  const reduce = useReducedMotion()
  const [preview, setPreview] = useState(null)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const enabled = useMemo(
    () => Boolean(FEATURED_COUPON) && !isPlaceholderMode(),
    [],
  )

  useEffect(() => {
    if (!enabled) return
    if (!shouldShowAgain()) return

    let cancelled = false
    ;(async () => {
      try {
        const data = await validateCoupon({
          code: FEATURED_COUPON,
          courseId: primaryCourse.id,
          customerEmail: '',
        })
        if (cancelled) return
        if (data?.ok) {
          setPreview(data)
          setVisible(true)
        }
      } catch {
        // silently ignore — banner just won't show
      }
    })()
    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (!visible) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [visible])

  const handleDismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // ignore
    }
  }

  if (!enabled || !preview || !visible) return null

  const expiryMs = preview.expiryDate
    ? new Date(preview.expiryDate).getTime() - now
    : null
  const countdown = expiryMs !== null ? formatCountdown(expiryMs) : null
  if (expiryMs !== null && expiryMs <= 0) return null

  const discountLabel =
    preview.discountType === 'percentage'
      ? `${preview.discountValue}% OFF`
      : `${formatRupees(preview.discountValue)} OFF`

  return (
    <AnimatePresence>
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6"
      >
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-purple-500/10 p-5 shadow-[0_30px_70px_-40px_rgba(251,191,36,0.55)] sm:p-6">
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss offer"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-slate-700 transition-colors hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            <X size={14} />
          </button>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 pr-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-[0_14px_30px_-12px_rgba(245,158,11,0.7)]">
                <Flame size={18} />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Limited offer
                </div>
                <div className="mt-1 text-lg font-bold tracking-tight text-slate-950 dark:text-white sm:text-xl">
                  Use code{' '}
                  <span className="rounded-lg bg-slate-950 px-2 py-0.5 font-mono text-base text-white dark:bg-white dark:text-slate-950">
                    {preview.code}
                  </span>{' '}
                  for {discountLabel}
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {preview.remainingSlots !== null && preview.remainingSlots > 0
                    ? `Only ${preview.remainingSlots} seat${
                        preview.remainingSlots === 1 ? '' : 's'
                      } left.`
                    : 'Offer ends soon.'}
                  {countdown && (
                    <>
                      {' · '}
                      <span className="font-semibold text-rose-600 dark:text-rose-300">
                        Expires in {countdown}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <a
              href="#courses"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              Grab offer
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
