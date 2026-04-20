import { corsHeaders, json } from '../_shared/cors.ts'
import { getCourse } from '../_shared/courses.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'
import { checkRateLimit, clientIpFromRequest } from '../_shared/rateLimit.ts'

// Public endpoint — preview-only. Never reserves a slot.
// Aggressive rate limit prevents coupon-code enumeration / brute force.
const RATE_LIMIT = 20
const WINDOW_MS = 60_000

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(`validate:${ip}`, RATE_LIMIT, WINDOW_MS)
  if (!rate.allowed) {
    return json(
      { error: 'Too many attempts. Please wait a minute and try again.' },
      429,
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const code = `${body?.code || ''}`.trim()
    const courseId = `${body?.courseId || ''}`.trim()
    const customerEmail = `${body?.customerEmail || ''}`.trim().toLowerCase()

    if (!code) {
      return json({ error: 'Please enter a coupon code.' }, 400)
    }
    if (code.length > 64) {
      return json({ error: 'Coupon code is too long.' }, 400)
    }
    if (!courseId) {
      return json({ error: 'Course is required.' }, 400)
    }

    const course = getCourse(courseId)
    if (!course) {
      return json({ error: 'Unknown course selected.' }, 400)
    }

    const supabase = getServiceSupabase()
    const { data, error } = await supabase.rpc('preview_coupon', {
      p_code: code,
      p_customer_email: customerEmail || null,
      p_cart_amount: course.amount,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data || data.ok !== true) {
      return json(
        { ok: false, error: data?.error || 'Coupon cannot be applied.' },
        200,
      )
    }

    const discount = Number(data.discount_amount || 0)
    const finalAmount = Math.max(course.amount - discount, 0)

    return json({
      ok: true,
      code: data.code,
      discountAmount: discount,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      originalAmount: course.amount,
      finalAmount,
      currency: course.currency,
      expiryDate: data.expiry_date,
      remainingSlots: data.remaining_slots,
    })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unable to validate coupon.' },
      500,
    )
  }
})
