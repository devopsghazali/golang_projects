import { corsHeaders, json } from '../_shared/cors.ts'
import { getCourse } from '../_shared/courses.ts'
import { createRazorpayOrder, getPublicRazorpayConfig } from '../_shared/razorpay.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'
import { checkRateLimit, clientIpFromRequest } from '../_shared/rateLimit.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(`order:${ip}`, 30, 60_000)
  if (!rate.allowed) {
    return json({ error: 'Too many checkout attempts. Please wait a minute.' }, 429)
  }

  let reservationId: string | null = null
  const supabase = getServiceSupabase()

  try {
    const body = await request.json()
    const courseId = `${body?.courseId || ''}`.trim()
    const customerName = `${body?.customer?.name || ''}`.trim()
    const customerEmail = `${body?.customer?.email || ''}`.trim().toLowerCase()
    const customerPhone = `${body?.customer?.phone || ''}`.trim()
    const couponCodeRaw = `${body?.couponCode || ''}`.trim()

    if (!courseId || !customerName || !customerEmail || !customerPhone) {
      return json({ error: 'courseId, name, email, and phone are required.' }, 400)
    }

    const course = getCourse(courseId)
    if (!course) {
      return json({ error: 'Unknown course selected.' }, 400)
    }

    let discountAmount = 0
    let appliedCouponCode: string | null = null

    if (couponCodeRaw) {
      if (couponCodeRaw.length > 64) {
        return json({ error: 'Coupon code is too long.' }, 400)
      }

      const { data: reservation, error: reservationError } = await supabase.rpc(
        'try_reserve_coupon',
        {
          p_code: couponCodeRaw,
          p_customer_email: customerEmail,
          p_cart_amount: course.amount,
          p_hold_minutes: 30,
        },
      )

      if (reservationError) {
        throw new Error(reservationError.message)
      }

      if (!reservation || reservation.ok !== true) {
        return json(
          { error: reservation?.error || 'Coupon cannot be applied.' },
          400,
        )
      }

      discountAmount = Number(reservation.discount_amount || 0)
      reservationId = reservation.redemption_id || null
      appliedCouponCode = reservation.code || couponCodeRaw.toUpperCase()
    }

    const finalAmount = Math.max(course.amount - discountAmount, 0)
    if (finalAmount <= 0) {
      // 100% off would bypass Razorpay entirely — block for safety.
      if (reservationId) {
        await supabase.rpc('release_coupon_reservation', {
          p_redemption_id: reservationId,
        })
      }
      return json({ error: 'Final amount is invalid. Coupon cannot be applied.' }, 400)
    }

    const purchaseInsert = {
      course_id: course.id,
      course_name: course.name,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      amount: finalAmount,
      original_amount: course.amount,
      discount_amount: discountAmount,
      coupon_code: appliedCouponCode,
      coupon_redemption_id: reservationId,
      currency: 'INR',
      status: 'created',
      source: 'website',
      gateway_response: {},
      notes: appliedCouponCode
        ? `Order created with coupon ${appliedCouponCode}.`
        : 'Order created from website checkout.',
    }

    const { data: createdPurchase, error: insertError } = await supabase
      .from('course_purchases')
      .insert(purchaseInsert)
      .select('id')
      .single()

    if (insertError || !createdPurchase) {
      throw new Error(insertError?.message || 'Unable to create purchase record.')
    }

    const order = await createRazorpayOrder({
      amount: finalAmount,
      receipt: createdPurchase.id,
      notes: {
        purchase_id: createdPurchase.id,
        course_id: course.id,
        customer_email: customerEmail,
        coupon_code: appliedCouponCode || '',
      },
    })

    const { error: updateError } = await supabase
      .from('course_purchases')
      .update({
        razorpay_order_id: order.id,
        gateway_response: order,
      })
      .eq('id', createdPurchase.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    return json({
      purchaseId: createdPurchase.id,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      courseId: course.id,
      courseName: course.name,
      originalAmount: course.amount,
      discountAmount,
      couponCode: appliedCouponCode,
      ...getPublicRazorpayConfig(),
    })
  } catch (error) {
    if (reservationId) {
      try {
        await supabase.rpc('release_coupon_reservation', {
          p_redemption_id: reservationId,
        })
      } catch (releaseError) {
        console.error('Failed to release coupon reservation:', releaseError)
      }
    }
    return json(
      { error: error instanceof Error ? error.message : 'Unable to create order.' },
      500,
    )
  }
})
