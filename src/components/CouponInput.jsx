import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BadgeCheck, Loader2, Tag, X } from 'lucide-react'
import { formatRupees, validateCoupon } from '../lib/coupon'

export default function CouponInput({
  course,
  customerEmail,
  disabled = false,
  onApplied,
  onCleared,
}) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(null)

  useEffect(() => {
    if (applied && disabled) return
    if (!applied) return
    // If email changes after coupon was applied, drop it so backend re-reserves
    // with correct email on order create.
  }, [customerEmail, applied, disabled])

  const handleApply = async (event) => {
    event?.preventDefault?.()
    if (busy || disabled) return

    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError('Enter a coupon code.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const data = await validateCoupon({
        code: trimmed,
        courseId: course.id,
        customerEmail,
      })

      if (!data?.ok) {
        const rawError = data?.error || 'This coupon cannot be applied.'
        const friendly = /already used/i.test(rawError)
          ? `${rawError} Apna naya email + name daalo (same email pe coupon sirf ek baar chalta hai).`
          : rawError
        setError(friendly)
        setApplied(null)
        onCleared?.()
        return
      }

      const payload = {
        code: data.code,
        discountAmount: Number(data.discountAmount) || 0,
        discountType: data.discountType,
        discountValue: data.discountValue,
        originalAmount: Number(data.originalAmount) || course.amount,
        finalAmount: Number(data.finalAmount) || course.amount,
        currency: data.currency || course.currency,
        expiryDate: data.expiryDate || null,
        remainingSlots:
          data.remainingSlots === null || data.remainingSlots === undefined
            ? null
            : Number(data.remainingSlots),
      }

      setApplied(payload)
      setCode(payload.code)
      onApplied?.(payload)
    } catch (err) {
      setError(err?.message || 'Unable to validate coupon right now.')
      setApplied(null)
      onCleared?.()
    } finally {
      setBusy(false)
    }
  }

  const handleClear = () => {
    if (disabled) return
    setApplied(null)
    setCode('')
    setError('')
    onCleared?.()
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-sm">
        <Tag size={14} className="text-emerald-500" />
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Have a coupon code?
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {applied ? (
          <motion.div
            key="applied"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <BadgeCheck size={16} className="text-emerald-500" />
              <div>
                <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {applied.code} applied
                </div>
                <div className="text-[12px] text-emerald-700/80 dark:text-emerald-200/80">
                  {applied.discountType === 'percentage'
                    ? `${applied.discountValue}% OFF`
                    : `${formatRupees(applied.discountValue)} OFF`}
                  {applied.remainingSlots !== null
                    ? ` · ${applied.remainingSlots} slot${
                        applied.remainingSlots === 1 ? '' : 's'
                      } left`
                    : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Remove coupon"
              className="rounded-full bg-white/70 p-1.5 text-emerald-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-emerald-200 dark:hover:bg-white/15"
            >
              <X size={14} />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="entry"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2 flex gap-2"
          >
            <input
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase())
                if (error) setError('')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleApply(event)
              }}
              disabled={disabled || busy}
              placeholder="ENTER COUPON CODE"
              maxLength={32}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[0.12em] text-slate-900 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={disabled || busy || !code.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.7)] transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : 'Apply'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && !applied && (
        <p className="mt-2 text-[12px] text-rose-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
