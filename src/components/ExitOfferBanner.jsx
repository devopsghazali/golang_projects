import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, Sparkles, Tag, X } from 'lucide-react'
import { fetchBannerConfig, DEFAULT_BANNER } from '../lib/siteConfig'

const SESSION_KEY_MOUSE = 'cpa-exit-offer-mouse'
const SESSION_KEY_ROUTE = 'cpa-exit-offer-route'
const TRIGGER_EVENT = 'cpa-exit-offer-trigger'
const AUTO_DISMISS_MS = 15_000
const WATCHED_PATH = '/join-courses'
const HIDDEN_NEXT_PATHS = new Set(['/admin', '/dashboard'])

export default function ExitOfferBanner() {
  const location = useLocation()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [config, setConfig] = useState(DEFAULT_BANNER)
  const firedMouseRef = useRef(false)
  const firedRouteRef = useRef(false)
  const dismissTimerRef = useRef(null)
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    let cancelled = false
    fetchBannerConfig().then((banner) => {
      if (!cancelled) setConfig(banner)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY_MOUSE) === '1') {
        firedMouseRef.current = true
      }
      if (sessionStorage.getItem(SESSION_KEY_ROUTE) === '1') {
        firedRouteRef.current = true
      }
    } catch {
      // sessionStorage blocked — allow once per mount
    }
  }, [])

  const triggerMouse = () => {
    if (firedMouseRef.current) return
    if (!config.enabled) return
    firedMouseRef.current = true
    try {
      sessionStorage.setItem(SESSION_KEY_MOUSE, '1')
    } catch {
      // ignore
    }
    setVisible(true)
  }

  const triggerRoute = () => {
    if (firedRouteRef.current) return
    if (!config.enabled) return
    firedRouteRef.current = true
    try {
      sessionStorage.setItem(SESSION_KEY_ROUTE, '1')
    } catch {
      // ignore
    }
    setVisible(true)
  }

  useEffect(() => {
    const handleMouseLeave = (event) => {
      if (event.clientY <= 0) triggerMouse()
    }
    const handleCustomEvent = () => triggerMouse()

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener(TRIGGER_EVENT, handleCustomEvent)
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener(TRIGGER_EVENT, handleCustomEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enabled])

  useEffect(() => {
    const prev = prevPathRef.current
    const next = location.pathname
    if (
      prev === WATCHED_PATH &&
      next !== WATCHED_PATH &&
      !HIDDEN_NEXT_PATHS.has(next)
    ) {
      triggerRoute()
    }
    prevPathRef.current = next
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, config.enabled])

  useEffect(() => {
    if (!visible) return undefined
    dismissTimerRef.current = window.setTimeout(
      () => setVisible(false),
      AUTO_DISMISS_MS,
    )
    return () => {
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current)
    }
  }, [visible])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.couponCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked — no-op
    }
  }

  const handleApply = () => {
    setVisible(false)
    const code = encodeURIComponent(config.couponCode)
    navigate(`${WATCHED_PATH}?coupon=${code}#courses`)
  }

  return (
    <AnimatePresence>
      {visible && config.enabled && (
        <motion.aside
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-1/2 z-[65] w-[92vw] max-w-[360px] -translate-x-1/2 overflow-hidden rounded-3xl border border-emerald-400/40 bg-white shadow-[0_30px_80px_-20px_rgba(16,185,129,0.5)] dark:border-emerald-400/30 dark:bg-slate-950 sm:bottom-6 sm:left-6 sm:translate-x-0"
        >
          <div className="relative bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 px-4 py-2.5 text-white">
            <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
              <Sparkles size={16} />
              <span>Limited offer</span>
            </div>
            <button
              type="button"
              onClick={() => setVisible(false)}
              aria-label="Dismiss offer"
              className="absolute right-2 top-2 rounded-full bg-white/15 p-1 text-white transition-colors hover:bg-white/25"
            >
              <X size={14} />
            </button>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-emerald-400/50 bg-emerald-500/5 px-3 py-2.5 dark:bg-emerald-500/10">
              <Tag size={14} className="text-emerald-500" />
              <span className="flex-1 text-sm font-bold tracking-[0.14em] text-slate-900 dark:text-white">
                {config.couponCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
              >
                {copied ? (
                  <>
                    <Check size={12} /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={12} /> Copy
                  </>
                )}
              </button>
            </div>

            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600 dark:text-amber-300">
              {config.slotsText}
            </p>

            <button
              type="button"
              onClick={handleApply}
              className="mt-3 w-full rounded-2xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_40px_-16px_rgba(16,185,129,0.6)] transition-transform hover:-translate-y-0.5"
            >
              Apply Now
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
