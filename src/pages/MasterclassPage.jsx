import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react'
import Background from '../components/Background'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import { masterclassCourse } from '../data/courses'
import { createOrder, simulatePlaceholderPurchase, verifyPayment } from '../lib/payment'
import { launchRazorpayCheckout } from '../lib/razorpay'
import { isPlaceholderMode } from '../lib/config'
import { formatRupees } from '../lib/coupon'

const VIDEO_EMBED_URL =
  'https://player.cloudinary.com/embed/?cloud_name=di6hn9fwh&public_id=1.55_second_olwcrf&player[controls]=true&player[autoplay]=false&player[muted]=false'

const initialForm = { name: '', email: '', phone: '' }
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^[+]?\d[\d\s-]{7,15}$/
const storageKey = 'cpamaster-last-purchase'

function getNextClassTime() {
  return new Date('2026-06-07T09:00:00+05:30')
}

function formatClassDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}

function getCountdownParts(target) {
  const total = Math.max(0, target.getTime() - Date.now())
  return {
    hours: Math.floor(total / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  }
}

function validate(form) {
  if (form.name.trim().length < 2) return 'Please enter your full name.'
  if (!emailPattern.test(form.email.trim())) return 'Please enter a valid email.'
  if (!phonePattern.test(form.phone.trim())) return 'Please enter a valid WhatsApp number.'
  return ''
}

function persistAndNavigate(purchase, navigate) {
  localStorage.setItem(storageKey, JSON.stringify(purchase))
  navigate('/success')
}

function CountdownPill({ value, label }) {
  return (
    <motion.div
      key={`${label}-${value}`}
      initial={false}
      animate={{ y: [0, -2, 0], borderColor: ['#dbeafe', '#60a5fa', '#dbeafe'] }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-3 py-2 text-center shadow-sm dark:border-blue-400/20 dark:from-blue-500/15 dark:via-white/10 dark:to-cyan-500/15"
    >
      <div className="text-xl font-extrabold leading-none tracking-tight text-blue-600 dark:text-cyan-200">
        {String(value).padStart(2, '0')}
      </div>
      <div className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-300">
        {label}
      </div>
    </motion.div>
  )
}

function PaymentMethodStrip() {
  const logoBase = `${import.meta.env.BASE_URL}assets/payments`
  const logos = [
    { label: 'Paytm', src: `${logoBase}/paytm.svg` },
    { label: 'PhonePe', src: `${logoBase}/phonepe.svg` },
    { label: 'Google Pay', src: `${logoBase}/googlepay.svg` },
    { label: 'Visa', src: `${logoBase}/visa.svg` },
    { label: 'Mastercard', src: `${logoBase}/mastercard.svg` },
  ]
  return (
    <div className="mt-5 rounded-2xl bg-white px-3 py-3 shadow-sm ring-1 ring-blue-100 dark:bg-slate-900 dark:ring-white/10">
      <div className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        Accepted payments
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        {logos.map((method) => (
          <div
            key={method.label}
            className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl bg-slate-50 px-2 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10"
          >
            <img
              src={method.src}
              alt={`${method.label} accepted`}
              className="max-h-5 max-w-full"
              loading="lazy"
            />
          </div>
        ))}
        <div className="flex h-10 min-w-0 flex-1 items-center justify-center rounded-xl bg-slate-50 px-2 text-[11px] font-extrabold text-slate-700 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-200 dark:ring-white/10">
          UPI
        </div>
      </div>
    </div>
  )
}

export default function MasterclassPage() {
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [form, setForm] = useState(initialForm)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [target, setTarget] = useState(() => getNextClassTime())
  const [tick, setTick] = useState(() => Date.now())
  const placeholderMode = isPlaceholderMode()

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick(Date.now())
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const countdown = useMemo(() => {
    void tick
    return getCountdownParts(target)
  }, [target, tick])

  const benefits = [
    'CPA marketing ka complete offer-to-payout roadmap',
    'High-paying USA offers aur niches choose karne ka process',
    '0 investment earning proof and practical examples',
    'Beginner to advance execution system with simple daily action steps',
    'Beginner mistakes, tracking, and webinar action plan',
  ]

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return

    const validation = validate(form)
    if (validation) {
      setError(validation)
      return
    }

    const customer = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    }

    setBusy(true)
    setError('')

    if (placeholderMode) {
      try {
        const purchase = simulatePlaceholderPurchase({
          courseId: masterclassCourse.id,
          customer,
        })
        persistAndNavigate({ ...purchase, status: 'verified' }, navigate)
      } catch (mockError) {
        setError(mockError.message || 'Unable to prepare preview checkout.')
        setBusy(false)
      }
      return
    }

    try {
      const order = await createOrder({
        courseId: masterclassCourse.id,
        customer,
      })
      await launchRazorpayCheckout({
        order,
        customer,
        onSuccess: async (paymentResponse) => {
          const verified = await verifyPayment({
            purchaseId: order.purchaseId,
            courseId: masterclassCourse.id,
            customer,
            ...paymentResponse,
          })
          persistAndNavigate(
            {
              ...verified.purchase,
              status: 'verified',
              createdAt: new Date().toISOString(),
            },
            navigate,
          )
        },
        onDismiss: () => setBusy(false),
      })
    } catch (checkoutError) {
      setError(checkoutError?.message || 'Unable to start checkout right now.')
      setBusy(false)
    }
  }

  return (
    <>
      <Background />
      <ThemeToggle />

      <main className="relative mx-auto w-full max-w-[680px] px-3 pb-12 pt-6 sm:px-6">
        <motion.article
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_26px_90px_-52px_rgba(15,23,42,0.7)] dark:border-white/10 dark:bg-slate-950"
        >
          <div className="px-5 pb-6 pt-7 sm:px-8 sm:pt-9">
            <h1 className="font-display text-[30px] font-extrabold leading-[1.1] tracking-tight text-slate-950 dark:text-white sm:text-[40px]">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                CPA Income Webinar:
              </span>{' '}
              <span className="text-slate-950 dark:text-white">Beginner to Advance</span>{' '}
              <span className="text-emerald-600">Online Income Roadmap</span>
            </h1>
            <p className="mt-4 text-[16px] font-medium leading-7 text-slate-600 dark:text-slate-300">
              Offer select karna, organic traffic lana aur CPA campaign setup
              karna - beginner to advance step by step webinar.
            </p>
            <p className="mt-5 flex flex-nowrap items-center gap-2 whitespace-nowrap text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              <span className="text-slate-950 dark:text-white">Register Now @</span>
              <span className="rounded-xl bg-blue-600 px-3 py-1 text-white shadow-[0_14px_35px_-20px_rgba(37,99,235,0.8)]">
                {masterclassCourse.priceLabel}
              </span>
              <span className="text-[15px] font-bold text-slate-400 line-through sm:text-base">
                &#8377;999
              </span>
            </p>
            <div className="mt-7 overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-[0_24px_70px_-46px_rgba(15,23,42,0.75)] dark:border-white/10 dark:bg-slate-900">
              <div className="flex justify-center bg-slate-950 px-3 py-4">
                <div className="relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-2xl bg-black shadow-[0_18px_60px_-34px_rgba(0,0,0,0.9)]">
                  <iframe
                    title="CPA income webinar video"
                    src={VIDEO_EMBED_URL}
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
              </div>
            </div>

            <motion.section
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -90, scale: 0.96 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="mt-7 rounded-[20px] bg-white px-4 py-4 shadow-sm ring-1 ring-blue-100 dark:bg-white/[0.04] dark:ring-blue-400/15"
            >
              <h2 className="font-display text-[24px] font-bold tracking-tight text-slate-950 dark:text-white">
                Webinar <span className="text-blue-600">Timings</span>
              </h2>
              <div className="mt-4 space-y-3 text-[16px] font-semibold leading-6 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3">
                  <CalendarDays size={20} className="text-blue-500" />
                  {formatClassDate(target)}
                </div>
                <div className="flex items-center gap-3">
                  <Clock3 size={20} className="text-emerald-500" />
                  09:00 AM IST
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <CountdownPill value={countdown.hours} label="Hours" />
                <CountdownPill value={countdown.minutes} label="Mins" />
                <CountdownPill value={countdown.seconds} label="Secs" />
              </div>
            </motion.section>

            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 90, scale: 0.96 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="relative mt-7 overflow-hidden rounded-[24px] border-[3px] border-blue-500 bg-gradient-to-br from-blue-100 via-white to-cyan-100 px-3 py-4 shadow-[0_34px_90px_-38px_rgba(37,99,235,1)] ring-4 ring-blue-200/80 dark:border-blue-400/60 dark:from-blue-500/20 dark:via-white/[0.05] dark:to-cyan-500/20 dark:ring-blue-400/15 sm:px-5 sm:py-5"
            >
              <form
                onSubmit={handleSubmit}
                className="relative rounded-[20px] bg-white/96 p-3 shadow-[inset_0_0_0_1px_rgba(37,99,235,0.14)] dark:bg-slate-950/82 sm:p-4"
              >
                <motion.label
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -18 }}
                  whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative block text-[14px] font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-slate-100"
                >
                  Name <span className="text-rose-500">*</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    disabled={busy}
                    autoComplete="name"
                    className="mt-2 h-[60px] w-full rounded-xl border-2 border-blue-300 bg-white px-4 text-[16px] font-semibold text-slate-950 outline-none shadow-[0_12px_28px_-24px_rgba(15,23,42,0.65)] transition-shadow focus:border-blue-600 focus:shadow-[0_0_0_5px_rgba(37,99,235,0.18)] disabled:opacity-60 dark:border-blue-400/35 dark:bg-slate-900 dark:text-white"
                  />
                </motion.label>

                <motion.label
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 18 }}
                  whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ delay: 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative mt-5 block text-[14px] font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-slate-100"
                >
                  Email <span className="text-rose-500">*</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    disabled={busy}
                    autoComplete="email"
                    className="mt-2 h-[60px] w-full rounded-xl border-2 border-blue-300 bg-white px-4 text-[16px] font-semibold text-slate-950 outline-none shadow-[0_12px_28px_-24px_rgba(15,23,42,0.65)] transition-shadow focus:border-blue-600 focus:shadow-[0_0_0_5px_rgba(37,99,235,0.18)] disabled:opacity-60 dark:border-blue-400/35 dark:bg-slate-900 dark:text-white"
                  />
                </motion.label>

                <motion.label
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: -18 }}
                  whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="relative mt-5 block text-[14px] font-extrabold uppercase tracking-[0.08em] text-slate-950 dark:text-slate-100"
                >
                  WhatsApp Number <span className="text-rose-500">*</span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={busy}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+91XXXXXXXXXX"
                    className="mt-2 h-[60px] w-full rounded-xl border-2 border-blue-300 bg-white px-4 text-[16px] font-semibold text-slate-950 outline-none shadow-[0_12px_28px_-24px_rgba(15,23,42,0.65)] transition-shadow focus:border-blue-600 focus:shadow-[0_0_0_5px_rgba(37,99,235,0.18)] disabled:opacity-60 dark:border-blue-400/35 dark:bg-slate-900 dark:text-white"
                  />
                </motion.label>

                {error && (
                  <p className="mt-3 text-sm font-medium text-rose-500" role="alert">
                    {error}
                  </p>
                )}

                <motion.button
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
                  whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.7 }}
                  transition={{ delay: 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  type="submit"
                  whileTap={reduce || busy ? undefined : { scale: 0.98 }}
                  disabled={busy}
                  className="relative mt-6 inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-[20px] font-extrabold tracking-tight text-white shadow-[0_22px_56px_-22px_rgba(37,99,235,0.95)] transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy && <Loader2 size={18} className="animate-spin" />}
                  {busy
                    ? 'Opening secure checkout...'
                    : `Register Now @ ${formatRupees(masterclassCourse.amount)}`}
                </motion.button>

                <PaymentMethodStrip />
              </form>
            </motion.div>

            <motion.section
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: -90, scale: 0.96 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 rounded-[20px] bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-400/15"
            >
              <h2 className="font-display text-[24px] font-bold leading-snug tracking-tight text-slate-950 dark:text-white">
                In This Webinar, You'll Learn the{' '}
                <span className="text-emerald-600">Exact Roadmap</span>
              </h2>
              <div className="mt-5 space-y-3">
                {benefits.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 text-[16px] leading-7 text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 size={20} className="mt-1 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: 90, scale: 0.96 }}
              whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 rounded-[20px] bg-slate-50 px-4 py-4 ring-1 ring-slate-200/70 dark:bg-white/[0.04] dark:ring-white/10"
            >
              <h2 className="font-display text-[24px] font-bold tracking-tight text-slate-950 dark:text-white">
                Contact <span className="text-blue-600">Creator</span>
              </h2>
              <div className="mt-4 space-y-3 text-[16px] font-medium leading-7 text-slate-600 dark:text-slate-300">
                <a
                  href="mailto:kaif829974@gmail.com"
                  className="flex items-center gap-3 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  <Mail size={20} />
                  kaif829974@gmail.com
                </a>
                <a
                  href="https://wa.me/918299745166"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-300"
                >
                  <Phone size={20} />
                  +91 82997 45166
                </a>
              </div>
            </motion.section>
          </div>
        </motion.article>

        <Footer />
      </main>
    </>
  )
}
