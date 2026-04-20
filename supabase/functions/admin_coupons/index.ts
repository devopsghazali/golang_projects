import { corsHeaders, json } from '../_shared/cors.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'
import { AdminAuthError, assertAdmin } from '../_shared/admin.ts'
import { checkRateLimit, clientIpFromRequest } from '../_shared/rateLimit.ts'

// Admin-protected coupon management. Requires `x-admin-token` header
// matching ADMIN_API_TOKEN (stored only in Supabase secrets).
// Brute-force defense: rate limit by IP regardless of auth outcome.

const codePattern = /^[A-Z0-9_-]{3,32}$/
const typePattern = /^(fixed|percentage)$/
const statusPattern = /^(active|inactive)$/

function sanitizeCode(raw: unknown) {
  return `${raw || ''}`.trim().toUpperCase()
}

function parseInteger(value: unknown, fallback: number | null = null) {
  if (value === undefined || value === null || value === '') return fallback
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.trunc(num)
}

function parseDate(value: unknown) {
  if (!value) return null
  const str = `${value}`
  const d = new Date(str)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(`admin:${ip}`, 120, 60_000)
  if (!rate.allowed) {
    return json({ error: 'Too many admin requests, slow down.' }, 429)
  }

  let actor: string
  try {
    actor = assertAdmin(request)
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
      case 'list':
        return await handleList(supabase)
      case 'stats':
        return await handleStats(supabase, payload)
      case 'create':
        return await handleCreate(supabase, payload, actor)
      case 'update':
        return await handleUpdate(supabase, payload, actor)
      case 'delete':
        return await handleDelete(supabase, payload, actor)
      case 'toggle':
        return await handleToggle(supabase, payload, actor)
      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Admin action failed.' },
      500,
    )
  }
})

async function handleList(supabase: ReturnType<typeof getServiceSupabase>) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return json({ ok: true, coupons: data || [] })
}

async function handleStats(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
) {
  const couponId = `${payload?.couponId || ''}`.trim()
  if (!couponId) {
    return json({ error: 'couponId is required for stats.' }, 400)
  }

  const { data: redemptions, error } = await supabase
    .from('coupon_redemptions')
    .select('id, status, discount_amount, customer_email, purchase_id, created_at, confirmed_at, coupon_code')
    .eq('coupon_id', couponId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(error.message)

  const confirmed = (redemptions || []).filter((r) => r.status === 'confirmed')
  const reserved = (redemptions || []).filter((r) => r.status === 'reserved')
  const totalDiscount = confirmed.reduce(
    (sum, r) => sum + (Number(r.discount_amount) || 0),
    0,
  )

  return json({
    ok: true,
    counts: {
      confirmed: confirmed.length,
      reserved: reserved.length,
      total: (redemptions || []).length,
    },
    totalDiscount,
    redemptions: redemptions || [],
  })
}

async function handleCreate(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
  actor: string,
) {
  const code = sanitizeCode(payload?.code)
  if (!codePattern.test(code)) {
    return json(
      { error: 'Code must be 3-32 chars, uppercase letters, digits, _ or -.' },
      400,
    )
  }

  const discountType = `${payload?.discountType || ''}`.trim().toLowerCase()
  if (!typePattern.test(discountType)) {
    return json({ error: 'discountType must be "fixed" or "percentage".' }, 400)
  }

  const discountValue = parseInteger(payload?.discountValue)
  if (discountValue === null || discountValue <= 0) {
    return json({ error: 'discountValue must be a positive integer.' }, 400)
  }
  if (discountType === 'percentage' && discountValue > 100) {
    return json({ error: 'Percentage discount cannot exceed 100.' }, 400)
  }

  const maxUsers = parseInteger(payload?.maxUsers, null)
  if (maxUsers !== null && maxUsers <= 0) {
    return json({ error: 'maxUsers must be positive or null.' }, 400)
  }

  const minAmount = parseInteger(payload?.minAmount, null)
  if (minAmount !== null && minAmount < 0) {
    return json({ error: 'minAmount must be non-negative.' }, 400)
  }

  const expiryDate = parseDate(payload?.expiryDate)

  const status = `${payload?.status || 'active'}`.trim().toLowerCase()
  if (!statusPattern.test(status)) {
    return json({ error: 'status must be "active" or "inactive".' }, 400)
  }

  const notes = payload?.notes ? `${payload.notes}`.slice(0, 500) : null

  const { data: inserted, error } = await supabase
    .from('coupons')
    .insert({
      code,
      discount_type: discountType,
      discount_value: discountValue,
      max_users: maxUsers,
      min_amount: minAmount,
      expiry_date: expiryDate,
      status,
      notes,
      created_by: actor,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return json({ error: 'A coupon with this code already exists.' }, 409)
    }
    throw new Error(error.message)
  }

  await logAudit(supabase, {
    coupon_id: inserted.id,
    coupon_code: inserted.code,
    action: 'created',
    actor,
    metadata: {
      discount_type: discountType,
      discount_value: discountValue,
      max_users: maxUsers,
      expiry_date: expiryDate,
    },
  })

  return json({ ok: true, coupon: inserted })
}

async function handleUpdate(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
  actor: string,
) {
  const id = `${payload?.id || ''}`.trim()
  if (!id) {
    return json({ error: 'Coupon id is required.' }, 400)
  }

  const updates: Record<string, unknown> = {}
  const auditMeta: Record<string, unknown> = {}

  if (payload?.discountType !== undefined) {
    const discountType = `${payload.discountType}`.trim().toLowerCase()
    if (!typePattern.test(discountType)) {
      return json({ error: 'discountType must be "fixed" or "percentage".' }, 400)
    }
    updates.discount_type = discountType
    auditMeta.discount_type = discountType
  }

  if (payload?.discountValue !== undefined) {
    const discountValue = parseInteger(payload.discountValue)
    if (discountValue === null || discountValue <= 0) {
      return json({ error: 'discountValue must be a positive integer.' }, 400)
    }
    if (updates.discount_type === 'percentage' && discountValue > 100) {
      return json({ error: 'Percentage discount cannot exceed 100.' }, 400)
    }
    updates.discount_value = discountValue
    auditMeta.discount_value = discountValue
  }

  if (payload?.maxUsers !== undefined) {
    const maxUsers = parseInteger(payload.maxUsers, null)
    if (maxUsers !== null && maxUsers <= 0) {
      return json({ error: 'maxUsers must be positive or null.' }, 400)
    }
    updates.max_users = maxUsers
    auditMeta.max_users = maxUsers
  }

  if (payload?.minAmount !== undefined) {
    const minAmount = parseInteger(payload.minAmount, null)
    if (minAmount !== null && minAmount < 0) {
      return json({ error: 'minAmount must be non-negative.' }, 400)
    }
    updates.min_amount = minAmount
    auditMeta.min_amount = minAmount
  }

  if (payload?.expiryDate !== undefined) {
    updates.expiry_date = parseDate(payload.expiryDate)
    auditMeta.expiry_date = updates.expiry_date
  }

  if (payload?.status !== undefined) {
    const status = `${payload.status}`.trim().toLowerCase()
    if (!statusPattern.test(status)) {
      return json({ error: 'status must be "active" or "inactive".' }, 400)
    }
    updates.status = status
    auditMeta.status = status
  }

  if (payload?.notes !== undefined) {
    updates.notes = payload.notes ? `${payload.notes}`.slice(0, 500) : null
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'No updates provided.' }, 400)
  }

  const { data: updated, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Coupon not found.')
  }

  await logAudit(supabase, {
    coupon_id: updated.id,
    coupon_code: updated.code,
    action: 'updated',
    actor,
    metadata: auditMeta,
  })

  return json({ ok: true, coupon: updated })
}

async function handleDelete(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
  actor: string,
) {
  const id = `${payload?.id || ''}`.trim()
  if (!id) {
    return json({ error: 'Coupon id is required.' }, 400)
  }

  const { data: existing } = await supabase
    .from('coupons')
    .select('id, code')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) {
    throw new Error(error.message)
  }

  if (existing) {
    await logAudit(supabase, {
      coupon_id: null,
      coupon_code: existing.code,
      action: 'deleted',
      actor,
      metadata: { id },
    })
  }

  return json({ ok: true })
}

async function handleToggle(
  supabase: ReturnType<typeof getServiceSupabase>,
  payload: Record<string, unknown>,
  actor: string,
) {
  const id = `${payload?.id || ''}`.trim()
  if (!id) {
    return json({ error: 'Coupon id is required.' }, 400)
  }

  const { data: current, error: fetchError } = await supabase
    .from('coupons')
    .select('id, code, status')
    .eq('id', id)
    .single()

  if (fetchError || !current) {
    throw new Error(fetchError?.message || 'Coupon not found.')
  }

  const nextStatus = current.status === 'active' ? 'inactive' : 'active'

  const { data: updated, error } = await supabase
    .from('coupons')
    .update({ status: nextStatus })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !updated) {
    throw new Error(error?.message || 'Unable to toggle status.')
  }

  await logAudit(supabase, {
    coupon_id: updated.id,
    coupon_code: updated.code,
    action: nextStatus === 'active' ? 'activated' : 'deactivated',
    actor,
    metadata: { previous: current.status, next: nextStatus },
  })

  return json({ ok: true, coupon: updated })
}

async function logAudit(
  supabase: ReturnType<typeof getServiceSupabase>,
  entry: {
    coupon_id: string | null
    coupon_code: string | null
    action: string
    actor: string
    metadata: Record<string, unknown>
  },
) {
  const { error } = await supabase.from('coupon_audit_log').insert(entry)
  if (error) {
    console.error('coupon_audit_log insert failed:', error.message)
  }
}
