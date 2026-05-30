import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Globe,
  IndianRupee,
  LogOut,
  MapPin,
  Megaphone,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Users,
} from 'lucide-react'
import Background from '../components/Background'
import ThemeToggle from '../components/ThemeToggle'
import AdminLogin from '../components/admin/AdminLogin'
import {
  adminRequest,
  clearAdminCredentials,
  getAdminToken,
} from '../lib/admin'
import { formatRupees } from '../lib/coupon'

const DASHBOARD_ENDPOINT = { endpoint: 'admin_dashboard' }
const ANALYTICS_ENDPOINT = { endpoint: 'admin_analytics' }

const statusStyles = {
  verified:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  captured:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  created:
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  failed:
    'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
}

function statusChip(status) {
  const key = `${status || 'created'}`.toLowerCase()
  const cls =
    statusStyles[key] ||
    'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${cls}`}
    >
      {key}
    </span>
  )
}

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    }).format(d)
  } catch {
    return iso
  }
}

function describeMethod(row) {
  if (!row.method) return '—'
  const m = row.method.toLowerCase()
  if (m === 'card') {
    const brand = row.cardNetwork ? row.cardNetwork.toUpperCase() : 'Card'
    const last4 = row.cardLast4 ? ` ••${row.cardLast4}` : ''
    return `${brand}${last4}`
  }
  if (m === 'upi') return row.vpa ? `UPI · ${row.vpa}` : 'UPI'
  if (m === 'netbanking') return row.bank ? `NB · ${row.bank}` : 'NetBanking'
  if (m === 'wallet') return row.wallet ? `Wallet · ${row.wallet}` : 'Wallet'
  return m
}

function FunnelStep({ label, count, base }) {
  const pct = base > 0 ? Math.round((count / base) * 100) : 0
  const widthPct = base > 0 ? Math.max(4, (count / base) * 100) : 4
  return (
    <div className="mt-3 first:mt-0">
      <div className="flex items-center justify-between gap-2 text-[12px] font-semibold text-slate-700 dark:text-slate-300">
        <span>{label}</span>
        <span className="text-slate-500 dark:text-slate-400">
          {count.toLocaleString()} {base > 0 && base !== count ? `· ${pct}%` : ''}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200/70 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  )
}

function MiniBars({ trend }) {
  if (!trend?.length) return null
  const max = Math.max(...trend.map((t) => t.visitors), 1)
  return (
    <div className="mt-3 flex items-end gap-1.5">
      {trend.map((t) => {
        const h = Math.max(6, (t.visitors / max) * 100)
        const day = t.day ? t.day.slice(5) : ''
        return (
          <div key={t.day} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-gradient-to-t from-purple-500/80 to-fuchsia-400/80"
              style={{ height: `${h}px`, minHeight: 6 }}
              title={`${day}: ${t.visitors} visitors`}
            />
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {day}
            </div>
            <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
              {t.visitors}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ListCard({ icon: Icon, title, items, valueKey = 'visitors', labelKey }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
        <Icon size={13} />
        <span>{title}</span>
      </div>
      {items?.length ? (
        <ul className="mt-3 space-y-1.5">
          {items.map((item, i) => (
            <li
              key={`${item[labelKey]}-${i}`}
              className="flex items-center justify-between gap-3 text-[12px]"
            >
              <span className="truncate text-slate-700 dark:text-slate-300">
                {item[labelKey] || 'Unknown'}
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {Number(item[valueKey] || 0).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">
          No data yet.
        </p>
      )}
    </div>
  )
}

function AnalyticsSection({ analytics, loading, error }) {
  if (!analytics && !loading && !error) return null

  return (
    <section className="mt-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5 p-5 dark:border-purple-400/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
          <Activity size={14} />
          <span>Traffic Insights · PostHog (last 7 days)</span>
        </div>
        {loading && (
          <RefreshCw size={14} className="animate-spin text-purple-500" />
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      {analytics && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Today's visitors"
              value={(analytics.summary?.todayVisitors || 0).toLocaleString()}
              sub={`Yesterday: ${(analytics.summary?.yesterdayVisitors || 0).toLocaleString()}`}
              tone="emerald"
            />
            <StatCard
              icon={Globe}
              label="7-day visitors"
              value={(analytics.summary?.weekVisitors || 0).toLocaleString()}
              sub={`${(analytics.summary?.weekPageviews || 0).toLocaleString()} pageviews`}
              tone="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="7-day coupon applies"
              value={(analytics.summary?.weekCouponApplies || 0).toLocaleString()}
              sub="Custom event"
              tone="amber"
            />
            <StatCard
              icon={CheckCircle2}
              label="7-day payments"
              value={(analytics.summary?.weekPayments || 0).toLocaleString()}
              sub="payment_success event"
              tone="slate"
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                Conversion funnel
              </div>
              <FunnelStep
                label="Visitors"
                count={analytics.summary?.weekVisitors || 0}
                base={analytics.summary?.weekVisitors || 0}
              />
              <FunnelStep
                label="Coupon applied"
                count={analytics.summary?.weekCouponApplies || 0}
                base={analytics.summary?.weekVisitors || 0}
              />
              <FunnelStep
                label="Payment success"
                count={analytics.summary?.weekPayments || 0}
                base={analytics.summary?.weekVisitors || 0}
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                Daily visitors trend
              </div>
              <MiniBars trend={analytics.trend} />
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <ListCard
              icon={MapPin}
              title="Top cities"
              items={analytics.cities}
              labelKey="city"
            />
            <ListCard
              icon={Smartphone}
              title="Device split"
              items={analytics.devices}
              labelKey="device"
            />
            <ListCard
              icon={Globe}
              title="Top sources"
              items={analytics.sources}
              labelKey="source"
            />
          </div>
        </>
      )}
    </section>
  )
}

function StatCard({ icon: Icon, label, value, sub, tone = 'slate' }) {
  const toneMap = {
    emerald: 'from-emerald-500/15 to-cyan-500/10 text-emerald-500',
    blue: 'from-blue-500/15 to-indigo-500/10 text-blue-500',
    amber: 'from-amber-500/15 to-rose-500/10 text-amber-500',
    slate: 'from-slate-500/10 to-slate-500/5 text-slate-500',
  }
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br ${toneMap[tone]} p-5 dark:border-white/10`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
        <Icon size={14} />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[26px]">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
          {sub}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const [authed, setAuthed] = useState(() => Boolean(getAdminToken()))
  const [summary, setSummary] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState('')

  const load = useCallback(
    async (filters) => {
      setLoading(true)
      setError('')
      try {
        const [summaryRes, listRes, leadsRes] = await Promise.all([
          adminRequest('summary', {}, DASHBOARD_ENDPOINT),
          adminRequest(
            'list_purchases',
            {
              limit: 200,
              status: filters?.status ?? 'all',
              search: filters?.search ?? '',
            },
            DASHBOARD_ENDPOINT,
          ),
          adminRequest(
            'list_leads',
            {
              limit: 200,
              search: filters?.search ?? '',
            },
            DASHBOARD_ENDPOINT,
          ),
        ])
        setSummary(summaryRes)
        setPurchases(listRes?.purchases || [])
        setLeads(leadsRes?.leads || [])
      } catch (err) {
        if (err?.code === 'UNAUTHENTICATED') {
          clearAdminCredentials()
          setAuthed(false)
          setSummary(null)
          setPurchases([])
          setLeads([])
          setError('')
          return
        }
        setError(err?.message || 'Unable to load dashboard.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError('')
    try {
      const data = await adminRequest('summary', {}, ANALYTICS_ENDPOINT)
      setAnalytics(data)
    } catch (err) {
      setAnalytics(null)
      setAnalyticsError('')
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) {
      load({ status: statusFilter, search })
      loadAnalytics()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed])

  const handleSignOut = () => {
    clearAdminCredentials()
    setAuthed(false)
    setSummary(null)
    setPurchases([])
    setLeads([])
    setAnalytics(null)
  }

  const handleRefresh = () => {
    load({ status: statusFilter, search })
    loadAnalytics()
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    load({ status: statusFilter, search })
  }

  const methodEntries = useMemo(() => {
    const map = summary?.methodBreakdown || {}
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [summary])

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
      <main className="relative mx-auto w-full max-w-[1280px] px-4 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Admin console
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Sales Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Coupons →
            </Link>
            <button
              type="button"
              onClick={handleRefresh}
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

        {error && (
          <p
            className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-300"
            role="alert"
          >
            {error}
          </p>
        )}

        {summary && (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={IndianRupee}
                label="Total Revenue"
                value={formatRupees(summary.totals?.revenuePaise || 0)}
                sub={`${summary.totals?.verified || 0} verified sales`}
                tone="emerald"
              />
              <StatCard
                icon={CheckCircle2}
                label="Last 24 hours"
                value={`${summary.windows?.last24h?.count || 0} sales`}
                sub={formatRupees(summary.windows?.last24h?.revenuePaise || 0)}
                tone="blue"
              />
              <StatCard
                icon={BarChart3}
                label="Last 7 days"
                value={`${summary.windows?.last7d?.count || 0} sales`}
                sub={formatRupees(summary.windows?.last7d?.revenuePaise || 0)}
                tone="slate"
              />
              <StatCard
                icon={Users}
                label="Leads"
                value={(summary.totals?.leads || 0).toLocaleString()}
                sub={`${summary.totals?.masterclassLeads || 0} masterclass registrations`}
                tone="amber"
              />
            </div>

            {((summary.sourceAttribution || []).length > 0 ||
              (summary.topCoupons || []).length > 0) && (
              <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 p-5 dark:border-cyan-400/20">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                  <Megaphone size={14} />
                  <span>Coupon attribution — kahan se bike?</span>
                </div>
                {(summary.sourceAttribution || []).length === 0 ? (
                  <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                    No coupons redeemed yet. Tag coupons with a source when
                    you create them to track marketing channels here.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {summary.sourceAttribution.map((s) => (
                      <div
                        key={s.source}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-slate-950/60"
                      >
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            {s.source}
                          </div>
                          <div className="mt-0.5 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                            {s.count} {s.count === 1 ? 'sale' : 'sales'}
                          </div>
                        </div>
                        <div className="text-right text-[12px] font-semibold text-emerald-600 dark:text-emerald-300">
                          {formatRupees(s.revenuePaise || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {(summary.topCoupons || []).length > 0 && (
                  <div className="mt-4 border-t border-slate-200/60 pt-4 dark:border-white/10">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                      Top coupons
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {summary.topCoupons.map((c) => (
                        <li
                          key={c.code}
                          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          {c.code}
                          {c.source ? ` (${c.source})` : ''} · {c.count}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {methodEntries.length > 0 && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
                  <CreditCard size={14} />
                  <span>Payment methods</span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {methodEntries.map(([method, count]) => (
                    <li
                      key={method}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                    >
                      {method.toUpperCase()} · {count}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <AnalyticsSection
          analytics={analytics}
          loading={analyticsLoading}
          error={analyticsError}
        />

        <section className="mt-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 dark:border-emerald-400/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
                <Users size={14} />
                <span>Leads</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Form submit hote hi Supabase mein lead save hoti hai. Payment
                complete hone par same row verified ban jaati hai.
              </p>
            </div>
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
              {leads.length} latest leads
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-white/60 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Interest</th>
                  <th className="px-4 py-3">Order / Payment</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No leads found yet.
                    </td>
                  </tr>
                )}
                {leads.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 bg-white/50 transition-colors hover:bg-white dark:border-white/5 dark:bg-slate-950/30 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 align-top text-[12px] text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {row.customerName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatRupees(row.amount || 0)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-[12px] text-slate-700 dark:text-slate-300">
                      <div className="break-all">{row.customerEmail || '—'}</div>
                      <div className="text-slate-500">{row.customerPhone || '—'}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-300">
                        {row.source || 'website'}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-[12px] text-slate-700 dark:text-slate-300">
                      <div className="font-semibold">{row.courseName || '—'}</div>
                      <div className="mt-0.5 text-slate-500">{row.notes || ''}</div>
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="break-all">{row.razorpayOrderId || '—'}</div>
                      <div className="mt-1 break-all">{row.razorpayPaymentId || ''}</div>
                    </td>
                    <td className="px-4 py-3 align-top">{statusChip(row.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <form
          onSubmit={handleSearchSubmit}
          className="mt-6 flex flex-wrap items-center gap-2 rounded-3xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-slate-950"
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, phone, or payment id..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 outline-none focus:shadow-[0_0_0_4px_rgba(59,130,246,0.14)] dark:border-white/10 dark:bg-slate-900/70 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200"
          >
            <option value="all">All statuses</option>
            <option value="verified">Verified</option>
            <option value="captured">Captured</option>
            <option value="created">Created</option>
            <option value="failed">Failed</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-slate-950"
          >
            Apply
          </button>
        </form>

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Coupon</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No purchases found.
                    </td>
                  </tr>
                )}
                {purchases.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-white/5 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 align-top text-[12px] text-slate-600 dark:text-slate-400">
                      {formatDateTime(row.purchasedAt || row.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {row.customerName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {row.courseName}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-[12px] text-slate-700 dark:text-slate-300">
                      <div className="break-all">
                        {row.customerEmail || '—'}
                      </div>
                      <div className="text-slate-500">
                        {row.customerPhone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {formatRupees(row.amount || 0)}
                      </div>
                      {Number(row.discountAmount) > 0 && (
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-300">
                          -{formatRupees(row.discountAmount)} off
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-[12px] text-slate-700 dark:text-slate-300">
                      {describeMethod(row)}
                    </td>
                    <td className="px-4 py-3 align-top text-[12px] text-slate-700 dark:text-slate-300">
                      {row.couponCode ? (
                        <div>
                          <div className="font-semibold">{row.couponCode}</div>
                          {row.couponSource && (
                            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cyan-600 dark:text-cyan-300">
                              via {row.couponSource}
                            </div>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="break-all">
                        {row.razorpayPaymentId || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {statusChip(row.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-[12px] text-slate-500 dark:text-slate-400">
          Showing latest {purchases.length} records. Data served from Supabase
          via service-role key (RLS bypassed) — never exposed to non-admin
          visitors.
        </p>
      </main>
    </>
  )
}
