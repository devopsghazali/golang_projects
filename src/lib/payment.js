import {
  BRAND_NAME,
  GOOGLE_DRIVE_LINK,
  PAYMENT_MODE,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  isPlaceholderMode,
} from './config'
import { getCourseById } from '../data/courses'

async function invokeEdgeFunction(name, body) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.error || `Edge function ${name} failed.`)
  }

  return data
}

export function createOrder(payload) {
  if (isPlaceholderMode()) {
    throw new Error(
      'Razorpay is not connected yet. Switch VITE_PAYMENT_MODE to "live" after deploying the create_order edge function.',
    )
  }
  const body = {
    courseId: payload.courseId,
    customer: payload.customer,
  }
  if (payload.couponCode) {
    body.couponCode = payload.couponCode
  }
  return invokeEdgeFunction('create_order', body)
}

export function verifyPayment(payload) {
  if (isPlaceholderMode()) {
    throw new Error(
      'Razorpay is not connected yet. Switch VITE_PAYMENT_MODE to "live" after deploying the verify_payment edge function.',
    )
  }
  return invokeEdgeFunction('verify_payment', payload)
}

export async function fetchRecentBuyers() {
  if (isPlaceholderMode()) return []
  try {
    const data = await invokeEdgeFunction('recent_buyers', {})
    return data?.buyers || []
  } catch {
    return []
  }
}

export function simulatePlaceholderPurchase({ courseId, customer }) {
  const course = getCourseById(courseId)
  if (!course) throw new Error('Course not found for placeholder purchase.')

  const now = Date.now()
  const mockOrderId = `order_placeholder_${now}`
  const mockPaymentId = `pay_placeholder_${now}`

  return {
    purchaseId: `purchase_placeholder_${now}`,
    courseId: course.id,
    courseName: course.name,
    amount: course.amount,
    currency: course.currency || 'INR',
    priceLabel: course.priceLabel,
    brand: BRAND_NAME,
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    razorpayOrderId: mockOrderId,
    razorpayPaymentId: mockPaymentId,
    driveLink: GOOGLE_DRIVE_LINK,
    status: 'placeholder',
    mode: PAYMENT_MODE,
    createdAt: new Date(now).toISOString(),
  }
}
