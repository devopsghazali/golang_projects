import { corsHeaders, json } from '../_shared/cors.ts'
import { hmacSha256Hex, safeEqual } from '../_shared/crypto.ts'
import { getCourse } from '../_shared/courses.ts'
import { fetchRazorpayPayment } from '../_shared/razorpay.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const secret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!secret) {
      throw new Error('Missing RAZORPAY_KEY_SECRET.')
    }

    const supportPhone = Deno.env.get('SUPPORT_PHONE') || 'Add SUPPORT_PHONE'
    const body = await request.json()
    const purchaseId = `${body?.purchaseId || ''}`.trim()
    const courseId = `${body?.courseId || ''}`.trim()
    const customerName = `${body?.customer?.name || ''}`.trim()
    const customerEmail = `${body?.customer?.email || ''}`.trim().toLowerCase()
    const customerPhone = `${body?.customer?.phone || ''}`.trim()
    const razorpayOrderId = `${body?.razorpayOrderId || ''}`.trim()
    const razorpayPaymentId = `${body?.razorpayPaymentId || ''}`.trim()
    const razorpaySignature = `${body?.razorpaySignature || ''}`.trim()

    if (
      !purchaseId ||
      !courseId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return json({ error: 'Missing verification payload.' }, 400)
    }

    const expectedSignature = await hmacSha256Hex(
      `${razorpayOrderId}|${razorpayPaymentId}`,
      secret,
    )

    if (!safeEqual(expectedSignature, razorpaySignature)) {
      return json({ error: 'Payment signature mismatch.' }, 400)
    }

    const course = getCourse(courseId)
    if (!course) {
      return json({ error: 'Unknown course selected.' }, 400)
    }
    if (!course.driveLink) {
      throw new Error(`Missing drive link for ${course.name}.`)
    }

    const supabase = getServiceSupabase()

    // Read the purchase to learn the discounted amount we quoted + coupon hold
    const { data: purchase, error: purchaseError } = await supabase
      .from('course_purchases')
      .select(
        'id, amount, original_amount, discount_amount, coupon_code, coupon_redemption_id, status',
      )
      .eq('id', purchaseId)
      .single()

    if (purchaseError || !purchase) {
      throw new Error(purchaseError?.message || 'Purchase record not found.')
    }

    const expectedAmount = Number(purchase.amount || course.amount)
    const originalAmount = Number(purchase.original_amount || course.amount)
    const discountAmount = Number(purchase.discount_amount || 0)

    const payment = await fetchRazorpayPayment(razorpayPaymentId)
    if (payment.order_id !== razorpayOrderId) {
      return json({ error: 'Payment does not belong to the created order.' }, 400)
    }
    if (payment.amount !== expectedAmount) {
      return json({ error: 'Payment amount mismatch.' }, 400)
    }
    if (!['authorized', 'captured'].includes(payment.status)) {
      return json({ error: `Payment status is ${payment.status}.` }, 400)
    }

    const now = new Date().toISOString()

    const { data: updatedPurchase, error: updateError } = await supabase
      .from('course_purchases')
      .update({
        course_id: course.id,
        course_name: course.name,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        amount: payment.amount,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        currency: payment.currency,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
        status: 'verified',
        drive_link: course.driveLink,
        purchased_at: now,
        delivered_at: now,
        gateway_response: payment,
        notes: purchase.coupon_code
          ? `Payment verified with coupon ${purchase.coupon_code}.`
          : 'Payment verified and delivery unlocked.',
      })
      .eq('id', purchaseId)
      .select(
        'id, course_name, customer_name, customer_email, razorpay_order_id, razorpay_payment_id, drive_link, amount, original_amount, discount_amount, coupon_code',
      )
      .single()

    if (updateError || !updatedPurchase) {
      throw new Error(updateError?.message || 'Unable to update purchase record.')
    }

    if (purchase.coupon_redemption_id) {
      const { error: confirmError } = await supabase.rpc(
        'confirm_coupon_reservation',
        {
          p_redemption_id: purchase.coupon_redemption_id,
          p_purchase_id: purchaseId,
        },
      )
      if (confirmError) {
        console.error('Coupon confirm failed:', confirmError.message)
      }
    }

    return json({
      success: true,
      purchase: {
        id: updatedPurchase.id,
        courseName: updatedPurchase.course_name,
        customerName: updatedPurchase.customer_name,
        customerEmail: updatedPurchase.customer_email,
        razorpayOrderId: updatedPurchase.razorpay_order_id,
        razorpayPaymentId: updatedPurchase.razorpay_payment_id,
        driveLink: updatedPurchase.drive_link,
        amount: updatedPurchase.amount,
        originalAmount: updatedPurchase.original_amount,
        discountAmount: updatedPurchase.discount_amount,
        couponCode: updatedPurchase.coupon_code,
        supportPhone,
      },
    })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unable to verify payment.' },
      500,
    )
  }
})
