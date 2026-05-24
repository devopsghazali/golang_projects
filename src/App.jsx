import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import LandingPage from './pages/LandingPage'
import JoinCoursesPage from './pages/JoinCoursesPage'
import FreeGuidePage from './pages/FreeGuidePage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import AdminPage from './pages/AdminPage'
import DashboardPage from './pages/DashboardPage'
import WhatsAppRedirectPage from './pages/WhatsAppRedirectPage'
import ChatBot from './components/ChatBot'
import ExitOfferBanner from './components/ExitOfferBanner'

const MotionDiv = motion.div

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

function AnimatedRoutes() {
  const location = useLocation()
  const reduce = useReducedMotion()

  const variants = reduce
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: -24 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
        exit: {
          opacity: 0,
          y: -12,
          transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
        },
      }

  return (
    <AnimatePresence mode="wait">
      <MotionDiv
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/join-courses" element={<JoinCoursesPage />} />
          <Route path="/free-guide" element={<FreeGuidePage />} />
          <Route path="/success" element={<PaymentSuccessPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/whatsapp-a"
            element={<WhatsAppRedirectPage phoneNumber="8299745166" />}
          />
          <Route
            path="/whatsapp-b"
            element={<WhatsAppRedirectPage phoneNumber="7706904909" />}
          />
          <Route
            path="/whatsapp-8299745166"
            element={<WhatsAppRedirectPage phoneNumber="8299745166" />}
          />
          <Route
            path="/whatsapp-7706904909"
            element={<WhatsAppRedirectPage phoneNumber="7706904909" />}
          />
        </Routes>
      </MotionDiv>
    </AnimatePresence>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const isWhatsAppPage = pathname.startsWith('/whatsapp-')

  return (
    <>
      <ScrollToTop />
      <AnimatedRoutes />
      {!isWhatsAppPage && <ChatBot />}
      {!isWhatsAppPage && <ExitOfferBanner />}
    </>
  )
}
