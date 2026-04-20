import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isPlaceholderMode } from './config'

export async function validateCoupon({ code, courseId, customerEmail }) {
  if (isPlaceholderMode()) {
    throw new Error('Coupons are disabled in preview mode.')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/validate_coupon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      code: (code || '').trim(),
      courseId,
      customerEmail: (customerEmail || '').trim().toLowerCase(),
    }),
  })

  const data = await response.json().catch(() => null)

  if (response.status === 429) {
    throw new Error(data?.error || 'Too many attempts. Please wait and try again.')
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Unable to validate coupon.')
  }

  return data
}

export function formatRupees(paise) {
  const rupees = Math.max(0, Math.round(Number(paise) || 0)) / 100
  return `\u20B9${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
