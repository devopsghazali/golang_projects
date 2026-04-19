import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Globe,
  Rocket,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import Background from '../components/Background'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'

const sections = [
  {
    id: 'intro',
    icon: Compass,
    title: 'CPA Marketing Kya Hai?',
    body: [
      'CPA ka full form hai Cost Per Action. Iska matlab — har baar jab koi user aapke diye hue link par ek specific action complete karta hai (jaise email submit, app install, sign up, ya survey fill), tab aapko paisa milta hai.',
      'Normal affiliate marketing me user ko product kharidna padta hai, jo thoda hard hota hai. CPA me usko sirf ek simple action karna hota hai, isliye conversion bahut zyada hota hai.',
      'Example: Ek CPA offer hai "US users ka email submit karo — $2 milega". Agar aap 50 US users ka email submit karwate ho, aapko $100 milta hai. Koi product bechne ki zarurat nahi.',
    ],
  },
  {
    id: 'kyon',
    icon: Rocket,
    title: 'CPA Marketing Kyon Choose Karein?',
    body: [
      'Beginner friendly — product bechne ki zarurat nahi, sirf action karwana hota hai.',
      'Zero ad budget possible — organic traffic methods (Instagram reels, YouTube shorts, Pinterest, SEO) se bhi kaafi kamai ho sakti hai.',
      'Fast payment — most networks weekly ya bi-weekly payout dete hain (NET-7, NET-15). Affiliate marketing me 30-60 din wait karna padta hai.',
      'Global audience — USA, UK, Canada, Australia jaise high-paying countries target kar sakte ho.',
      'Scalable — ek offer convert karne laga to usi method ko aur traffic dene se income multiply hoti hai.',
    ],
  },
  {
    id: 'kaise',
    icon: Target,
    title: 'Kaise Shuru Karein (Step-by-Step)',
    body: [
      'STEP 1 — Ek beginner-friendly CPA network par account banao. CPALead sabse easy hai approve karane me. Baad me OGAds, Affmine, AdBlueMedia bhi try karo (yeh premium networks zyada payout dete hain par application zyada strict hoti hai).',
      'STEP 2 — Apne niche choose karo. Best beginner niches: gaming giveaways, mobile app installs, sweepstakes (iPhone/PS5 jeeto type offers), dating, finance.',
      'STEP 3 — Ek offer select karo jiska payout $1.50 se zyada ho aur conversion rate network dashboard me acha dikh raha ho (>3%).',
      'STEP 4 — Apna unique tracking link generate karo.',
      'STEP 5 — Traffic source decide karo — organic (Instagram/TikTok/YouTube) ya paid (agar budget hai to). Shuruat me 100% organic kariye.',
      'STEP 6 — Ek simple funnel banao: landing page ya direct content locking system. Landing page se conversion zyada hota hai kyun ki user ko context milta hai.',
      'STEP 7 — Pehle 7-14 din sirf traffic bhejo aur data dekho. Har offer ko minimum 100 clicks bhejne ke baad decide karo rakhna hai ya nahi.',
    ],
  },
  {
    id: 'traffic',
    icon: Globe,
    title: 'Best Organic Traffic Sources (No Ad Budget)',
    body: [
      'INSTAGRAM REELS: short-form viral content. Hook first 2 seconds me strong ho. Bio me CPA link daalo. Story me link sticker use karo.',
      'YOUTUBE SHORTS: 40-55 second ke videos jo highly engaging hon. Description me CPA link. Pinned comment me link. Algorithm shorts ko heavily push kar raha hai 2026 me.',
      'TIKTOK: USA-based audience ke liye gold mine. Content locking offers (PS5, iPhone giveaway type) yahan kaafi chalte hain.',
      'PINTEREST: SEO-driven traffic. Infographic pins banao aur CPA offer landing page par redirect karo. Long-term compounding traffic deta hai.',
      'QUORA + REDDIT: niche-specific sub-communities me value deke direct message me link share karo (spam mat karo — ban lag jayega).',
      'TELEGRAM + DISCORD: apna free community banao, daily value do, weekly ek CPA drop share karo.',
    ],
  },
  {
    id: 'usa',
    icon: Users,
    title: 'USA Traffic Method (Most Important)',
    body: [
      'CPA me sabse zyada paisa USA traffic ka hota hai. Ek US email submit = $1.50-$4. Ek US install = $5-$15. Tier-3 countries ka rate 10x kam hota hai.',
      'US traffic pane ke 3 bulletproof methods:',
      '1. Instagram reels me US-focused content (celebrity reactions, viral memes, US-centric humor) banao. Hashtags: #usa #american #nyc #florida etc.',
      '2. YouTube Shorts me US creators ke style copy karo — music/trending sounds same use karo. Algorithm location-agnostic hai agar content US me engage ho raha hai.',
      '3. Pinterest + US keywords SEO (walmart deals, target clearance, costco finds) — ye automatically US audience pull karta hai.',
      'US VPN use karke apne accounts banao/log in karo — algorithm ko signal jata hai ki aap US region ho, aur aapka content US feeds me aur dikhta hai.',
    ],
  },
  {
    id: 'earning',
    icon: Wallet,
    title: 'Kitni Earning Expect Karein?',
    body: [
      'Month 1 (Learning phase): $0 — $100. Ye normal hai. Traffic build ho rahi hai, accounts warm-up ho rahe hain.',
      'Month 2-3: $300 — $1,000 per month agar consistent 1 reel/short daily post kar rahe ho aur analytics ke hisab se iterate kar rahe ho.',
      'Month 4-6: $1,500 — $5,000 per month — jab aapko samajh aa jata hai konsa offer + konsi content style aapke niche me convert karti hai.',
      'Month 6+: $5,000 — $15,000+ per month scalable — jab aap multiple accounts, multiple niches, aur automation add karte ho.',
      'DISCLAIMER: yeh expected ranges hain based on community data (CPA MASTERY students ne public earning screenshots share kiye hain). Individual results discipline, niche selection, aur execution speed par depend karte hain. Koi guarantee nahi — sirf honest range.',
    ],
  },
  {
    id: 'mistakes',
    icon: TrendingUp,
    title: '5 Common Mistakes (Inko Avoid Karein)',
    body: [
      '1. 10 offers ek saath chalana — pehle 1 offer master karo, uski har angle try karo, phir dusra pick karo.',
      '2. Daily posting skip karna — algorithm ko consistency chahiye. Hafte me 2 post daloge to chhote creator ban ke reh jaoge.',
      '3. Paid ads pehle try karna bina budget experience ke — 95% beginners $500+ burn karke quit kar dete hain. Pehle organic master karo.',
      '4. Low payout offers chalana jo Tier-3 countries target karte hain. India/Bangladesh/Pakistan traffic ka rate bahut kam hai — aapka time waste hoga.',
      '5. Account sirf ek platform par banana. Instagram ban kar de to pura setup gaya. Always parallel banao: Instagram + YouTube + Pinterest minimum.',
    ],
  },
  {
    id: 'next',
    icon: BookOpen,
    title: 'Agla Step: CPA MASTERY Course',
    body: [
      'Yeh free guide sirf ek overview hai. Real execution ke liye aapko chahiye: live examples, working funnel templates, network selection help, US traffic detailed setup, mentorship for doubts, aur 3 months ka accountability window.',
      'CPA MASTERY course (₹2399 one-time) me yeh sab mila hai, plus hamari private Telegram community jahan daily real-time drops share hote hain.',
      'Is guide ko 2-3 baar padho, ek offer select karo, aur shuru ho jao. Perfection ke chakkar me mat ruko — action leke hi seekhoge.',
    ],
  },
]

const tocLinks = sections.map((s) => ({ id: s.id, title: s.title }))

export default function FreeGuidePage() {
  return (
    <>
      <Background />
      <ThemeToggle />

      <main className="relative mx-auto w-full max-w-[920px] px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="chip transition-transform duration-300 hover:-translate-y-0.5"
          >
            <ArrowLeft size={12} />
            <span>Back to home</span>
          </Link>
          <span className="chip">
            <BookOpen size={12} className="text-emerald-500" />
            <span>Free Guide · Roman Hindi</span>
          </span>
        </div>

        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 sm:mt-14"
        >
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-[56px]">
            CPA Marketing{' '}
            <span className="text-gradient-brand">Starter Blueprint</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 dark:text-slate-300">
            Ek honest, beginner-friendly guide — Roman Hindi me. Zero ad budget
            se shuru karke pehla dollar kamane tak ka poora roadmap. Bina
            hype, bina fake promises.
          </p>
        </motion.header>

        <motion.nav
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel mt-10 rounded-[24px] p-5 sm:p-6"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Table of Contents
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {tocLinks.map((link, index) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-white/60 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{link.title}</span>
                  </span>
                  <ChevronRight size={14} className="text-slate-400" />
                </a>
              </li>
            ))}
          </ul>
        </motion.nav>

        <div className="mt-12 space-y-14">
          {sections.map(({ icon: Icon, id, title, body }, index) => (
            <motion.section
              key={id}
              id={id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="scroll-mt-20"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_18px_40px_-22px_rgba(15,23,42,0.8)] dark:bg-white dark:text-slate-950">
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                    Chapter {String(index + 1).padStart(2, '0')}
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-[28px]">
                    {title}
                  </h2>
                </div>
              </div>

              <div className="mt-5 space-y-4 pl-[52px] text-[15px] leading-8 text-slate-700 dark:text-slate-300">
                {body.map((para, idx) => (
                  <p key={idx} className="flex gap-3">
                    <Check
                      size={16}
                      className="mt-1.5 shrink-0 text-emerald-500"
                    />
                    <span>{para}</span>
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-7 text-white shadow-[0_40px_100px_-30px_rgba(37,99,235,0.6)] sm:p-10"
        >
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/75">
            Ready for execution?
          </div>
          <h3 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Guide padh li. Ab course le ke start karo.
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/85 sm:text-[15px]">
            Theory khatam. Agla step hai CPA MASTERY — ek structured,
            hand-holding program jo aapko zero se first $1,000 tak le ke jata
            hai.
          </p>
          <Link
            to="/join-courses"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-transform duration-300 hover:-translate-y-0.5"
          >
            Join CPA MASTERY
            <ChevronRight size={16} />
          </Link>
        </motion.div>

        <Footer />
      </main>
    </>
  )
}
