import { useEffect, useState } from 'react'
import { Loader2, X } from 'lucide-react'

const emptyForm = {
  code: '',
  discountType: 'fixed',
  discountValue: '',
  maxUsers: '',
  minAmount: '',
  expiryDate: '',
  status: 'active',
  notes: '',
}

function toLocalDatetimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const tzOffset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
}

export default function CouponForm({ initial, onCancel, onSubmit, busy }) {
  const editing = Boolean(initial)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setForm({
        code: initial.code || '',
        discountType: initial.discount_type || 'fixed',
        discountValue:
          initial.discount_type === 'fixed'
            ? initial.discount_value
              ? String(Math.round(initial.discount_value / 100))
              : ''
            : String(initial.discount_value || ''),
        maxUsers: initial.max_users === null || initial.max_users === undefined
          ? ''
          : String(initial.max_users),
        minAmount:
          initial.min_amount === null || initial.min_amount === undefined
            ? ''
            : String(Math.round(initial.min_amount / 100)),
        expiryDate: toLocalDatetimeInput(initial.expiry_date),
        status: initial.status || 'active',
        notes: initial.notes || '',
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [initial])

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return

    const code = form.code.trim().toUpperCase()
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
      setError('Code must be 3-32 chars: A-Z, 0-9, _ or -.')
      return
    }

    const valueNum = Number(form.discountValue)
    if (!Number.isFinite(valueNum) || valueNum <= 0) {
      setError('Discount value must be a positive number.')
      return
    }

    if (form.discountType === 'percentage' && valueNum > 100) {
      setError('Percentage discount cannot exceed 100.')
      return
    }

    const maxUsersNum =
      form.maxUsers === '' ? null : Number(form.maxUsers)
    if (maxUsersNum !== null && (!Number.isFinite(maxUsersNum) || maxUsersNum <= 0)) {
      setError('Max users must be positive or blank.')
      return
    }

    const minAmountRupeesNum = form.minAmount === '' ? null : Number(form.minAmount)
    if (minAmountRupeesNum !== null && (!Number.isFinite(minAmountRupeesNum) || minAmountRupeesNum < 0)) {
      setError('Min amount must be non-negative or blank.')
      return
    }

    let expiryIso = null
    if (form.expiryDate) {
      const d = new Date(form.expiryDate)
      if (Number.isNaN(d.getTime())) {
        setError('Invalid expiry date.')
        return
      }
      expiryIso = d.toISOString()
    }

    const payload = {
      code,
      discountType: form.discountType,
      discountValue:
        form.discountType === 'fixed' ? Math.round(valueNum * 100) : Math.round(valueNum),
      maxUsers: maxUsersNum,
      minAmount: minAmountRupeesNum === null ? null : Math.round(minAmountRupeesNum * 100),
      expiryDate: expiryIso,
      status: form.status,
      notes: form.notes.trim() || null,
    }

    try {
      await onSubmit(payload)
    } catch (err) {
      setError(err?.message || 'Unable to save coupon.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-slate-950 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">
          {editing ? 'Edit coupon' : 'New coupon'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Code</span>
          <input
            type="text"
            value={form.code}
            onChange={(event) => handleChange('code', event.target.value.toUpperCase())}
            disabled={editing}
            placeholder="FIRST20"
            maxLength={32}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 font-semibold tracking-[0.1em] text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
          {editing && (
            <span className="text-[11px] text-slate-400">Code cannot be changed.</span>
          )}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Type</span>
          <select
            value={form.discountType}
            onChange={(event) => handleChange('discountType', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          >
            <option value="fixed">Fixed (₹)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {form.discountType === 'fixed' ? 'Discount (₹)' : 'Discount (%)'}
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max={form.discountType === 'percentage' ? 100 : undefined}
            step={form.discountType === 'fixed' ? '1' : '1'}
            value={form.discountValue}
            onChange={(event) => handleChange('discountValue', event.target.value)}
            placeholder={form.discountType === 'fixed' ? '500' : '20'}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Max users <span className="text-slate-400">(blank = unlimited)</span>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={form.maxUsers}
            onChange={(event) => handleChange('maxUsers', event.target.value)}
            placeholder="20"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Min cart (₹) <span className="text-slate-400">(blank = any)</span>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min="0"
            value={form.minAmount}
            onChange={(event) => handleChange('minAmount', event.target.value)}
            placeholder="1999"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Expiry <span className="text-slate-400">(blank = no expiry)</span>
          </span>
          <input
            type="datetime-local"
            value={form.expiryDate}
            onChange={(event) => handleChange('expiryDate', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-1">
          <span className="font-medium text-slate-700 dark:text-slate-300">Status</span>
          <select
            value={form.status}
            onChange={(event) => handleChange('status', event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Internal notes <span className="text-slate-400">(optional)</span>
          </span>
          <input
            type="text"
            value={form.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            maxLength={500}
            placeholder="Launch offer"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-sm text-rose-500" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : editing ? 'Save changes' : 'Create coupon'}
        </button>
      </div>
    </form>
  )
}
