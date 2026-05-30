export const courses = [
  {
    id: 'cpa-mastery',
    name: 'CPA MASTERY',
    badge: '3 Months Support',
    amount: 239900,
    priceLabel: '\u20b92399',
    currency: 'INR',
    highlight: 'One-Time Payment \u2013 No Extra Charges. No Ads Budget Required.',
    summary:
      'A complete beginner-to-advanced CPA marketing program with organic traffic methods, step-by-step mentorship, and a practical income system built for real execution.',
    learningPoints: [
      'CPA Marketing Beginner to Advanced',
      'High Converting CPA Methods',
      'Step-by-Step Training',
      'Organic Traffic Secrets',
      'Full USA Traffic Method',
      'Earn Upto $50/day',
      'Smart Work Income System',
      'Premium Mentorship Support (3 Months)',
      'Recorded Video Access',
      'Beginner Friendly System',
    ],
    benefits: [
      'Instant Google Drive delivery after verified payment',
      'Lifetime access to the recorded material',
      'Mentorship support window for three months',
      'Server-side signature verification on every order',
    ],
    fill: 'linear-gradient(120deg,#2563eb,#7c3aed 55%,#06b6d4)',
    iconBg: 'linear-gradient(135deg,#1d4ed8,#7c3aed 60%,#0891b2)',
    glow: 'rgba(124,58,237,0.28)',
  },
]

export const primaryCourse = courses[0]

export const masterclassCourse = {
  id: 'cpa-masterclass',
  name: 'CPA Income Webinar',
  badge: 'Live Webinar',
  amount: 2100,
  priceLabel: '\u20b921',
  currency: 'INR',
  highlight: 'Live beginner-to-advance webinar to start CPA marketing with organic traffic and USA offers.',
  summary:
    'A focused webinar showing how CPA marketing works, how to pick offers, and how to build a simple traffic system without paid ads.',
  learningPoints: [
    'CPA Marketing full process from offer to payout',
    'How to find high-paying USA offers',
    '0 investment earning proof and practical examples',
    'Beginner to advance execution system',
    'Beginner roadmap for first campaign setup',
    'Common mistakes that waste time and traffic',
  ],
  benefits: [
    'Live webinar access after verified payment',
    'Telegram updates for webinar date and joining link',
    'Beginner-friendly CPA roadmap',
    'Next step guidance after the webinar',
  ],
  fill: 'linear-gradient(120deg,#2563eb,#06b6d4 55%,#10b981)',
  iconBg: 'linear-gradient(135deg,#1d4ed8,#0891b2 60%,#059669)',
  glow: 'rgba(6,182,212,0.28)',
}

export function getCourseById(courseId) {
  return [masterclassCourse, ...courses].find((course) => course.id === courseId)
}
