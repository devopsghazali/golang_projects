import { BadgeCheck, Pencil, Power, Trash2, Users } from 'lucide-react'
import { formatRupees } from '../../lib/coupon'

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function couponDiscount(c) {
  if (c.discount_type === 'percentage') return `${c.discount_value}% OFF`
  return `${formatRupees(c.discount_value)} OFF`
}

function isExpired(c) {
  if (!c.expiry_date) return false
  return new Date(c.expiry_date).getTime() < Date.now()
}

export default function CouponList({
  coupons,
  loading,
  onEdit,
  onDelete,
  onToggle,
  pendingId,
}) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-950 dark:text-slate-400">
        Loading coupons...
      </div>
    )
  }

  if (!coupons.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-white/5">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
          No coupons yet
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Create your first coupon to start running offers.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-slate-950">
      <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 md:grid">
        <div className="col-span-3">Code</div>
        <div className="col-span-2">Discount</div>
        <div className="col-span-2">Usage</div>
        <div className="col-span-2">Expiry</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-2 text-right">Actions</div>
      </div>

      <ul className="divide-y divide-slate-200 dark:divide-white/10">
        {coupons.map((coupon) => {
          const expired = isExpired(coupon)
          const exhausted =
            coupon.max_users !== null &&
            coupon.max_users !== undefined &&
            coupon.used_count >= coupon.max_users
          const isPending = pendingId === coupon.id

          return (
            <li
              key={coupon.id}
              className="grid grid-cols-1 gap-3 px-5 py-4 text-sm md:grid-cols-12 md:items-center"
            >
              <div className="md:col-span-3">
                <div className="font-bold tracking-[0.1em] text-slate-950 dark:text-white">
                  {coupon.code}
                </div>
                {coupon.notes && (
                  <div className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
                    {coupon.notes}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="font-semibold text-emerald-600 dark:text-emerald-300">
                  {couponDiscount(coupon)}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {coupon.discount_type === 'percentage' ? 'Percentage' : 'Fixed'}
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Users size={14} />
                  <span>
                    {coupon.used_count}
                    {coupon.max_users ? ` / ${coupon.max_users}` : ''}
                  </span>
                </div>
                {exhausted && (
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                    Full
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="text-slate-700 dark:text-slate-300">
                  {coupon.expiry_date ? formatDate(coupon.expiry_date) : 'No expiry'}
                </div>
                {expired && (
                  <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-500">
                    Expired
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    coupon.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {coupon.status === 'active' && <BadgeCheck size={11} />}
                  {coupon.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-start gap-2 md:col-span-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => onToggle(coupon)}
                  disabled={isPending}
                  title={coupon.status === 'active' ? 'Deactivate' : 'Activate'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                >
                  <Power size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(coupon)}
                  disabled={isPending}
                  title="Edit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(coupon)}
                  disabled={isPending}
                  title="Delete"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 transition-colors hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-300"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
