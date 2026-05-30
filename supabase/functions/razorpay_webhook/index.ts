import { corsHeaders, json } from '../_shared/cors.ts'
import { hmacSha256Hex, safeEqual } from '../_shared/crypto.ts'
import { getCourse } from '../_shared/courses.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new Error('Missing RAZORPAY_WEBHOOK_SECRET.')
    }

    const rawBody = await request.text()
    const receivedSignature = request.headers.get('x-razorpay-signature') || ''
    const expectedSignature = await hmacSha256Hex(rawBody, webhookSecret)

    if (!safeEqual(expectedSignature, receivedSignature)) {
      return json({ error: 'Webhook signature mismatch.' }, 400)
    }

    const event = JSON.parse(rawBody)
    const eventName = `${event?.event || ''}`
    if (!['payment.captured', 'payment.failed', 'order.paid'].includes(eventName)) {
      return json({ received: true, skipped: true })
    }

    const paymentEntity = event?.payload?.payment?.entity
    const orderEntity = event?.payload?.order?.entity
    const orderId = paymentEntity?.order_id || orderEntity?.id || null
    let purchaseId = orderEntity?.receipt || paymentEntity?.notes?.purchase_id || null
    const supabase = getServiceSupabase()

    let existingPurchase: {
      id: string
      course_id: string | null
      coupon_redemption_id: string | null
      status: string | null
    } | null = null

    if (!purchaseId && orderId) {
      const { data, error } = await supabase
        .from('course_purchases')
        .select('id, course_id, coupon_redemption_id, status')
        .eq('razorpay_order_id', orderId)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      existingPurchase = data
      purchaseId = data?.id || null
    }

    if (!purchaseId) {
      return json({ received: true, skipped: true })
    }

    if (!existingPurchase) {
      const { data, error } = await supabase
        .from('course_purchases')
        .select('id, course_id, coupon_redemption_id, status')
        .eq('id', purchaseId)
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }

      existingPurchase = data
    }

    if (!existingPurchase) {
      return json({ received: true, skipped: true })
    }

    if (existingPurchase.status === 'verified' && eventName === 'payment.failed') {
      return json({ received: true, skipped: true })
    }

    const courseId = paymentEntity?.notes?.course_id || existingPurchase.course_id
    const course = courseId ? getCourse(courseId) : undefined
    const isPaidEvent =
      eventName === 'payment.captured' ||
      eventName === 'order.paid' ||
      paymentEntity?.status === 'captured' ||
      orderEntity?.status === 'paid'
    const status = isPaidEvent ? 'verified' : 'failed'
    const updatePayload: Record<string, unknown> = {
      status,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentEntity?.id || null,
      gateway_response: paymentEntity || event,
    }

    if (status === 'verified') {
      updatePayload.purchased_at = new Date().toISOString()
      updatePayload.delivered_at = updatePayload.purchased_at
      if (course?.driveLink) {
        updatePayload.drive_link = course.driveLink
      }
    }

    const { error } = await supabase
      .from('course_purchases')
      .update(updatePayload)
      .eq('id', purchaseId)

    if (error) {
      throw new Error(error.message)
    }

    if (status === 'verified' && existingPurchase.coupon_redemption_id) {
      const { error: confirmError } = await supabase.rpc(
        'confirm_coupon_reservation',
        {
          p_redemption_id: existingPurchase.coupon_redemption_id,
          p_purchase_id: purchaseId,
        },
      )
      if (confirmError) {
        console.error('Coupon confirm failed:', confirmError.message)
      }
    }

    const leadPayload: Record<string, unknown> = {
      status,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentEntity?.id || null,
      notes:
        status === 'verified'
          ? 'Payment verified from Razorpay webhook.'
          : 'Payment failed from Razorpay webhook.',
    }
    if (status === 'verified') {
      leadPayload.paid_at = updatePayload.purchased_at || new Date().toISOString()
    }

    const { error: leadUpdateError } = await supabase
      .from('masterclass_leads')
      .update(leadPayload)
      .eq('purchase_id', purchaseId)

    if (leadUpdateError) {
      console.error('Masterclass lead update failed:', leadUpdateError.message)
    }

    return json({ received: true })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      500,
    )
  }
})
