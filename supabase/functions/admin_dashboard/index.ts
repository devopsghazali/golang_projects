import { corsHeaders, json } from '../_shared/cors.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'
import { AdminAuthError, assertAdmin } from '../_shared/admin.ts'
import { checkRateLimit, clientIpFromRequest } from '../_shared/rateLimit.ts'

const paidStatuses = new Set(['verified', 'captured'])

// Admin-protected purchase analytics. Same ADMIN_API_TOKEN as
// admin_coupons — frontend sends `x-admin-token`.

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(`dashboard:${ip}`, 120, 60_000)
  if (!rate.allowed) {
    return json({ error: 'Too many dashboard requests, slow down.' }, 429)
  }

  try {
    assertAdmin(request)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return json({ error: error.message }, error.status)
    }
    return json({ error: 'Unauthorized.' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  const action = `${payload?.action || ''}`.trim()
  if (!action) {
    return json({ error: 'Missing action.' }, 400)
  }

  const supabase = getServiceSupabase()

  try {
    switch (action) {
      case 'summary':
        return await handleSummary(supabase)
      case 'list_purchases':
        return await handleListPurchases(supabase, payload)
      case 'list_leads':
        return await handleListLeads(supabase, payload)
      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Dashboard action failed.' },
      500,
    )
  }
})

async function handleSummary(supabase: ReturnType<typeof getServiceSupabase>) {
  const { data: rows, error } = await supabase
    .from('course_purchases')
    .select(
      'id, status, course_id, amount, coupon_code, purchased_at, created_at, gateway_response',
    )
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) throw new Error(error.message)

  const { count: leadCount, error: leadCountError } = await supabase
    .from('masterclass_leads')
    .select('id', { count: 'exact', head: true })

  if (leadCountError) throw new Error(leadCountError.message)

  const all = rows || []
  const verified = all.filter((r) => paidStatuses.has(r.status))
  const leads = all.filter((r) => !paidStatuses.has(r.status))

  const totalRevenuePaise = verified.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0,
  )

  const now = Date.now()
  const dayMs = 1000 * 60 * 60 * 24
  const in24h = verified.filter(
    (r) => new Date(r.purchased_at || r.created_at).getTime() > now - dayMs,
  )
  const in7d = verified.filter(
    (r) => new Date(r.purchased_at || r.created_at).getTime() > now - 7 * dayMs,
  )
  const in30d = verified.filter(
    (r) => new Date(r.purchased_at || r.created_at).getTime() > now - 30 * dayMs,
  )

  const methodBreakdown: Record<string, number> = {}
  for (const r of verified) {
    const gw = (r.gateway_response || {}) as Record<string, unknown>
    const method = `${gw.method || 'unknown'}`
    methodBreakdown[method] = (methodBreakdown[method] || 0) + 1
  }

  const couponUsage: Record<string, { count: number; revenuePaise: number }> = {}
  for (const r of verified) {
    if (r.coupon_code) {
      const cur = couponUsage[r.coupon_code] || { count: 0, revenuePaise: 0 }
      cur.count += 1
      cur.revenuePaise += Number(r.amount) || 0
      couponUsage[r.coupon_code] = cur
    }
  }

  const usedCodes = Object.keys(couponUsage)
  const codeSourceMap: Record<string, string | null> = {}
  if (usedCodes.length > 0) {
    const { data: couponRows } = await supabase
      .from('coupons')
      .select('code, source')
      .in('code', usedCodes)
    for (const row of couponRows || []) {
      codeSourceMap[row.code] = row.source || null
    }
  }

  const topCoupons = Object.entries(couponUsage)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([code, v]) => ({
      code,
      count: v.count,
      revenuePaise: v.revenuePaise,
      source: codeSourceMap[code] || null,
    }))

  const sourceBreakdown: Record<string, { count: number; revenuePaise: number }> = {}
  for (const [code, v] of Object.entries(couponUsage)) {
    const src = codeSourceMap[code] || 'Untagged'
    const cur = sourceBreakdown[src] || { count: 0, revenuePaise: 0 }
    cur.count += v.count
    cur.revenuePaise += v.revenuePaise
    sourceBreakdown[src] = cur
  }
  const sourceAttribution = Object.entries(sourceBreakdown)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([source, v]) => ({
      source,
      count: v.count,
      revenuePaise: v.revenuePaise,
    }))

  const conversionRate =
    all.length > 0 ? Math.round((verified.length / all.length) * 1000) / 10 : 0

  return json({
    ok: true,
    totals: {
      attempts: all.length,
      leads: leads.length,
      masterclassLeads: leadCount || 0,
      verified: verified.length,
      revenuePaise: totalRevenuePaise,
      conversionPercent: conversionRate,
    },
    windows: {
      last24h: {
        count: in24h.length,
        revenuePaise: in24h.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      },
      last7d: {
        count: in7d.length,
        revenuePaise: in7d.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      },
      last30d: {
        count: in30d.length,
        revenuePaise: in30d.reduce((s, r) => s + (Number(r.amount) || 0), 0),
      },
    },
    methodBreakdown,
    topCoupons,
    sourceAttribution,
  })
}

async function handleListPurchases(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
) {
  const limitInput = Number(payload?.limit)
  const limit = Number.isFinite(limitInput)
    ? Math.max(1, Math.min(500, Math.trunc(limitInput)))
    : 200
  const status = `${payload?.status || ''}`.trim().toLowerCase()
  const search = `${payload?.search || ''}`.trim().toLowerCase()

  let query = supabase
    .from('course_purchases')
    .select(
      'id, status, course_name, customer_name, customer_email, customer_phone, amount, original_amount, discount_amount, coupon_code, razorpay_order_id, razorpay_payment_id, purchased_at, created_at, gateway_response',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const like = `%${search}%`
    query = query.or(
      `customer_name.ilike.${like},customer_email.ilike.${like},customer_phone.ilike.${like},razorpay_payment_id.ilike.${like},razorpay_order_id.ilike.${like}`,
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data || []
  const usedCodes = Array.from(
    new Set(rows.map((r) => r.coupon_code).filter((c) => !!c) as string[]),
  )
  const codeSourceMap: Record<string, string | null> = {}
  if (usedCodes.length > 0) {
    const { data: couponRows } = await supabase
      .from('coupons')
      .select('code, source')
      .in('code', usedCodes)
    for (const row of couponRows || []) {
      codeSourceMap[row.code] = row.source || null
    }
  }

  const purchases = rows.map((r) => {
    const gw = (r.gateway_response || {}) as Record<string, unknown>
    return {
      id: r.id,
      status: r.status,
      courseName: r.course_name,
      customerName: r.customer_name,
      customerEmail: r.customer_email,
      customerPhone: r.customer_phone,
      amount: r.amount,
      originalAmount: r.original_amount,
      discountAmount: r.discount_amount,
      couponCode: r.coupon_code,
      couponSource: r.coupon_code ? codeSourceMap[r.coupon_code] || null : null,
      razorpayOrderId: r.razorpay_order_id,
      razorpayPaymentId: r.razorpay_payment_id,
      method: gw.method || null,
      bank: gw.bank || null,
      wallet: gw.wallet || null,
      vpa: gw.vpa || null,
      cardNetwork: (gw.card as Record<string, unknown>)?.network || null,
      cardLast4: (gw.card as Record<string, unknown>)?.last4 || null,
      purchasedAt: r.purchased_at,
      createdAt: r.created_at,
    }
  })

  return json({ ok: true, purchases, count: purchases.length, limit })
}

async function handleListLeads(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
) {
  const limitInput = Number(payload?.limit)
  const limit = Number.isFinite(limitInput)
    ? Math.max(1, Math.min(500, Math.trunc(limitInput)))
    : 200
  const search = `${payload?.search || ''}`.trim().toLowerCase()

  let query = supabase
    .from('masterclass_leads')
    .select(
      'id, purchase_id, status, course_id, course_name, customer_name, customer_email, customer_phone, amount, source, notes, razorpay_order_id, razorpay_payment_id, paid_at, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (search) {
    const like = `%${search}%`
    query = query.or(
      `customer_name.ilike.${like},customer_email.ilike.${like},customer_phone.ilike.${like},razorpay_payment_id.ilike.${like},razorpay_order_id.ilike.${like}`,
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const leads = (data || []).map((r) => ({
    id: r.id,
    purchaseId: r.purchase_id,
    status: r.status,
    courseId: r.course_id,
    courseName: r.course_name,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    amount: r.amount,
    source: r.source,
    notes: r.notes,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    paidAt: r.paid_at,
    createdAt: r.created_at,
  }))

  return json({ ok: true, leads, count: leads.length, limit })
}
