import { useState } from 'react'
import { LockKeyhole, Loader2 } from 'lucide-react'
import { adminRequest, setAdminCredentials, clearAdminCredentials } from '../../lib/admin'

export default function AdminLogin({ onAuthenticated }) {
  const [token, setToken] = useState('')
  const [actor, setActor] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Enter your admin token.')
      return
    }

    setBusy(true)
    setError('')

    setAdminCredentials({ token: trimmed, actor: actor.trim() || 'admin' })

    try {
      // Probe with a no-op list call — validates token server-side.
      await adminRequest('list')
      onAuthenticated?.()
    } catch (err) {
      clearAdminCredentials()
      setError(err?.message || 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_40px_90px_-40px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <LockKeyhole size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
            Admin sign in
          </h1>
          <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
            Restricted area. Token required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Admin token</span>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Paste ADMIN_API_TOKEN"
            autoComplete="current-password"
            autoFocus
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Your handle <span className="text-slate-400">(optional, shown in audit log)</span>
          </span>
          <input
            type="text"
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            placeholder="mkbhai"
            maxLength={60}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
          />
        </label>

        {error && (
          <p className="text-sm text-rose-500" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : 'Sign in'}
        </button>

        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-500">
          Token stays in this tab only. Closing the browser signs you out.
        </p>
      </form>
    </div>
  )
}
