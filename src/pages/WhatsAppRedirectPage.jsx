import { MessageCircle } from 'lucide-react'

const WHATSAPP_MESSAGE = 'Hi, I want more details.'

function WhatsAppLogo() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-20 w-20 sm:h-24 sm:w-24"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" fill="#25D366" />
      <path
        fill="#FFFFFF"
        d="M32.18 14.5c-9.35 0-16.96 7.54-16.96 16.81 0 2.96.78 5.85 2.27 8.4L15.08 48.5l9.06-2.35a17.1 17.1 0 0 0 8.04 2c9.35 0 16.96-7.54 16.96-16.84 0-9.27-7.61-16.81-16.96-16.81Zm0 30.8c-2.5 0-4.94-.66-7.08-1.9l-.51-.3-5.38 1.4 1.43-5.2-.34-.54a13.83 13.83 0 0 1-2.22-7.45c0-7.7 6.33-13.96 14.1-13.96 7.78 0 14.1 6.26 14.1 13.96 0 7.72-6.32 13.99-14.1 13.99Zm7.73-10.47c-.42-.2-2.5-1.22-2.88-1.36-.39-.14-.67-.2-.95.2-.28.42-1.1 1.36-1.34 1.64-.25.28-.5.31-.92.1-.42-.2-1.78-.65-3.4-2.08-1.25-1.1-2.1-2.47-2.35-2.9-.24-.41-.02-.63.19-.83.19-.19.42-.49.63-.73.21-.24.28-.41.42-.69.14-.28.07-.52-.04-.73-.1-.2-.95-2.27-1.3-3.1-.34-.82-.69-.7-.95-.72l-.8-.02c-.28 0-.73.1-1.12.52-.38.41-1.47 1.43-1.47 3.48 0 2.06 1.5 4.05 1.72 4.33.2.28 2.96 4.48 7.18 6.27 1 .43 1.79.69 2.4.88 1 .31 1.93.27 2.66.16.81-.12 2.5-1.02 2.85-2 .35-.97.35-1.8.24-1.98-.1-.18-.38-.28-.8-.48Z"
      />
    </svg>
  )
}

export default function WhatsAppRedirectPage({ phoneNumber }) {
  const displayNumber = `+91 ${phoneNumber.slice(0, 5)} ${phoneNumber.slice(5)}`
  const whatsappUrl = `https://wa.me/91${phoneNumber}?text=${encodeURIComponent(
    WHATSAPP_MESSAGE,
  )}`

  return (
    <main className="min-h-svh bg-[#f6fff9] text-slate-950">
      <section className="mx-auto flex min-h-svh w-full max-w-3xl flex-col items-center justify-center px-5 py-10 text-center">
        <a
          href={whatsappUrl}
          className="group flex w-full max-w-md flex-col items-center gap-7 rounded-lg border border-emerald-200 bg-white px-5 py-9 shadow-[0_24px_70px_-38px_rgba(22,101,52,0.65)] transition duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-[0_30px_90px_-42px_rgba(22,101,52,0.8)] focus-visible:outline-emerald-500"
          aria-label={`Open WhatsApp chat with ${displayNumber}`}
        >
          <span className="relative flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50">
            <span className="absolute inset-2 rounded-full border border-emerald-200" />
            <WhatsAppLogo />
          </span>

          <span className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition group-hover:bg-[#1ebe5d]">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Chat on WhatsApp
          </span>
        </a>
      </section>
    </main>
  )
}
