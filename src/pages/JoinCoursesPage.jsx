import { Link } from 'react-router-dom'
import { ArrowLeft, BadgeCheck } from 'lucide-react'
import Background from '../components/Background'
import ThemeToggle from '../components/ThemeToggle'
import RecentBuyersPopup from '../components/RecentBuyersPopup'
import CoursePurchaseCard from '../components/CoursePurchaseCard'
import CouponPromoBanner from '../components/CouponPromoBanner'
import WhyChooseSection from '../components/WhyChooseSection'
import NetworksSection from '../components/NetworksSection'
import HorizontalProofStrip from '../components/HorizontalProofStrip'
import EarningsTrustCard from '../components/EarningsTrustCard'
import RefundPolicySection from '../components/RefundPolicySection'
import FaqSection from '../components/FaqSection'
import CommunityCta from '../components/CommunityCta'
import Footer from '../components/Footer'
import { courses } from '../data/courses'

export default function JoinCoursesPage() {
  return (
    <>
      <Background />
      <ThemeToggle />
      <RecentBuyersPopup />

      <main className="relative mx-auto w-full max-w-[1180px] px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="chip transition-transform duration-300 hover:-translate-y-0.5"
          >
            <ArrowLeft size={12} />
            <span>Back to home</span>
          </Link>
          <span className="chip">
            <BadgeCheck size={12} className="text-emerald-500" />
            <span>Secure enrollment</span>
          </span>
        </div>

        <div className="mx-auto max-w-3xl">
          <CouponPromoBanner />
        </div>

        <section id="courses" className="mt-8 scroll-mt-20 sm:mt-12">
          <div className="mx-auto mt-2 grid max-w-3xl gap-6">
            {courses.map((course, index) => (
              <CoursePurchaseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        </section>

        <HorizontalProofStrip />
        <EarningsTrustCard />
        <WhyChooseSection />
        <NetworksSection />
        <RefundPolicySection />
        <FaqSection />
        <CommunityCta />

        <Footer />
      </main>
    </>
  )
}
