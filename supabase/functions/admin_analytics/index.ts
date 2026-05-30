import { corsHeaders, json } from '../_shared/cors.ts'
import { AdminAuthError, assertAdmin } from '../_shared/admin.ts'
import { checkRateLimit, clientIpFromRequest } from '../_shared/rateLimit.ts'

// Admin-protected PostHog analytics proxy. Personal API key lives ONLY
// in server env (POSTHOG_API_KEY). Project ID is also server-side
// (POSTHOG_PROJECT_ID). Frontend sends `x-admin-token` for auth.

const POSTHOG_HOST = 'https://us.posthog.com'

function emptyAnalytics(reason?: string) {
  return json({
    summary: {
      todayVisitors: 0,
      yesterdayVisitors: 0,
      weekVisitors: 0,
      weekCouponApplies: 0,
      weekPayments: 0,
      weekPageviews: 0,
    },
    trend: [],
    cities: [],
    devices: [],
    sources: [],
    generatedAt: new Date().toISOString(),
    configured: false,
    reason: reason || 'Analytics is not configured yet.',
  })
}

async function hogql(query: string, apiKey: string, projectId: string) {
  const response = await fetch(
    `${POSTHOG_HOST}/api/projects/${projectId}/query/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query },
      }),
    },
  )
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`PostHog ${response.status}: ${text.slice(0, 200)}`)
  }
  const data = await response.json()
  return (data?.results || []) as unknown[][]
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const ip = clientIpFromRequest(request)
  const rate = checkRateLimit(`analytics:${ip}`, 30, 60_000)
  if (!rate.allowed) {
    return json({ error: 'Too many analytics requests, slow down.' }, 429)
  }

  try {
    assertAdmin(request)
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return json({ error: error.message }, error.status)
    }
    return json({ error: 'Unauthorized.' }, 401)
  }

  const apiKey = Deno.env.get('POSTHOG_API_KEY') || ''
  const projectId = Deno.env.get('POSTHOG_PROJECT_ID') || ''
  if (!apiKey || !projectId) {
    return emptyAnalytics('PostHog credentials not configured on server.')
  }

  try {
    const [
      summaryRows,
      trendRows,
      cityRows,
      deviceRows,
      sourceRows,
    ] = await Promise.all([
      hogql(
        `SELECT
           countDistinctIf(person_id, event = '$pageview' AND timestamp >= today()) AS today_visitors,
           countDistinctIf(person_id, event = '$pageview' AND timestamp >= today() - INTERVAL 1 DAY AND timestamp < today()) AS yesterday_visitors,
           countDistinctIf(person_id, event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY) AS week_visitors,
           countDistinctIf(person_id, event = 'coupon_applied' AND timestamp >= now() - INTERVAL 7 DAY) AS week_coupon_applies,
           countDistinctIf(person_id, event = 'payment_success' AND timestamp >= now() - INTERVAL 7 DAY) AS week_payments,
           countIf(event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY) AS week_pageviews
         FROM events
         WHERE timestamp >= now() - INTERVAL 7 DAY`,
        apiKey,
        projectId,
      ),
      hogql(
        `SELECT
           toDate(timestamp) AS day,
           count(DISTINCT person_id) AS visitors
         FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
         GROUP BY day
         ORDER BY day`,
        apiKey,
        projectId,
      ),
      hogql(
        `SELECT
           coalesce(properties.$geoip_city_name, 'Unknown') AS city,
           count(DISTINCT person_id) AS visitors
         FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
         GROUP BY city
         ORDER BY visitors DESC
         LIMIT 6`,
        apiKey,
        projectId,
      ),
      hogql(
        `SELECT
           coalesce(properties.$device_type, 'Unknown') AS device,
           count(DISTINCT person_id) AS visitors
         FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
         GROUP BY device
         ORDER BY visitors DESC`,
        apiKey,
        projectId,
      ),
      hogql(
        `SELECT
           coalesce(nullIf(properties.$referring_domain, ''), 'Direct') AS source,
           count(DISTINCT person_id) AS visitors
         FROM events
         WHERE event = '$pageview' AND timestamp >= now() - INTERVAL 7 DAY
         GROUP BY source
         ORDER BY visitors DESC
         LIMIT 6`,
        apiKey,
        projectId,
      ),
    ])

    const s = (summaryRows[0] || []) as Array<number | null>
    const summary = {
      todayVisitors: Number(s[0] || 0),
      yesterdayVisitors: Number(s[1] || 0),
      weekVisitors: Number(s[2] || 0),
      weekCouponApplies: Number(s[3] || 0),
      weekPayments: Number(s[4] || 0),
      weekPageviews: Number(s[5] || 0),
    }

    const trend = trendRows.map((row) => ({
      day: String(row[0] || ''),
      visitors: Number(row[1] || 0),
    }))
    const cities = cityRows.map((row) => ({
      city: String(row[0] || 'Unknown'),
      visitors: Number(row[1] || 0),
    }))
    const devices = deviceRows.map((row) => ({
      device: String(row[0] || 'Unknown'),
      visitors: Number(row[1] || 0),
    }))
    const sources = sourceRows.map((row) => ({
      source: String(row[0] || 'Direct'),
      visitors: Number(row[1] || 0),
    }))

    return json({
      summary,
      trend,
      cities,
      devices,
      sources,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('PostHog analytics unavailable:', error)
    return emptyAnalytics('PostHog analytics unavailable.')
  }
})
