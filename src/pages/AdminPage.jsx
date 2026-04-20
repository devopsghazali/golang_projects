import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, LogOut, Plus, RefreshCw } from 'lucide-react'
import Background from '../components/Background'
import ThemeToggle from '../components/ThemeToggle'
import AdminLogin from '../components/admin/AdminLogin'
import CouponList from '../components/admin/CouponList'
import CouponForm from '../components/admin/CouponForm'
import {
  adminRequest,
  clearAdminCredentials,
  getAdminToken,
} from '../lib/admin'

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()))
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState({ type: 'idle' })
  const [pendingId, setPendingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadCoupons = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await adminRequest('list')
      setCoupons(data?.coupons || [])
    } catch (err) {
      if (err?.code === 'UNAUTHENTICATED') {
        clearAdminCredentials()
        setAuthed(false)
        return
      }
      setError(err?.message || 'Unable to load coupons.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      loadCoupons()
    }
  }, [authed, loadCoupons])

  const handleSignOut = () => {
    clearAdminCredentials()
    setAuthed(false)
    setCoupons([])
    setMode({ type: 'idle' })
  }

  const handleCreate = async (payload) => {
    setSaving(true)
    try {
      await adminRequest('create', payload)
      setMode({ type: 'idle' })
      await loadCoupons()
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (payload) => {
    setSaving(true)
    try {
      const id = mode.coupon?.id
      if (!id) throw new Error('Missing coupon id.')
      // code is not editable; strip it
      const { code: _omit, ...rest } = payload
      void _omit
      await adminRequest('update', { id, ...rest })
      setMode({ type: 'idle' })
      await loadCoupons()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (coupon) => {
    const confirmed = window.confirm(
      `Delete coupon ${coupon.code}? This cannot be undone.`,
    )
    if (!confirmed) return

    setPendingId(coupon.id)
    try {
      await adminRequest('delete', { id: coupon.id })
      await loadCoupons()
    } catch (err) {
      setError(err?.message || 'Unable to delete coupon.')
    } finally {
      setPendingId(null)
    }
  }

  const handleToggle = async (coupon) => {
    setPendingId(coupon.id)
    try {
      await adminRequest('toggle', { id: coupon.id })
      await loadCoupons()
    } catch (err) {
      setError(err?.message || 'Unable to toggle coupon.')
    } finally {
      setPendingId(null)
    }
  }

  if (!authed) {
    return (
      <>
        <Background />
        <ThemeToggle />
        <main className="relative mx-auto w-full max-w-[1180px] px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-12">
          <Link
            to="/"
            className="chip transition-transform duration-300 hover:-translate-y-0.5"
          >
            <ArrowLeft size={12} />
            <span>Back to home</span>
          </Link>
          <AdminLogin onAuthenticated={() => setAuthed(true)} />
        </main>
      </>
    )
  }

  return (
    <>
      <Background />
      <ThemeToggle />
      <main className="relative mx-auto w-full max-w-[1180px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Admin console
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Coupon Manager
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadCoupons}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-6">
          {mode.type === 'idle' && (
            <button
              type="button"
              onClick={() => setMode({ type: 'create' })}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              <Plus size={14} />
              New coupon
            </button>
          )}

          {mode.type === 'create' && (
            <CouponForm
              onCancel={() => setMode({ type: 'idle' })}
              onSubmit={handleCreate}
              busy={saving}
            />
          )}

          {mode.type === 'edit' && (
            <CouponForm
              initial={mode.coupon}
              onCancel={() => setMode({ type: 'idle' })}
              onSubmit={handleUpdate}
              busy={saving}
            />
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6">
          <CouponList
            coupons={coupons}
            loading={loading}
            onEdit={(coupon) => setMode({ type: 'edit', coupon })}
            onDelete={handleDelete}
            onToggle={handleToggle}
            pendingId={pendingId}
          />
        </div>
      </main>
    </>
  )
}
