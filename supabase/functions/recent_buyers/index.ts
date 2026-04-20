import { corsHeaders, json } from '../_shared/cors.ts'
import { getServiceSupabase } from '../_shared/supabase.ts'

function cleanName(name: string) {
  if (!name) return 'A learner'
  return name.trim().replace(/\s+/g, ' ')
}

function cityFromPhone(phone: string) {
  if (!phone) return 'India'
  return 'India'
}

function relativeTime(value: string | null) {
  if (!value) return 'Recently'
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes} mins ago`
  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hours ago`
  return `${Math.round(diffHours / 24)} days ago`
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = getServiceSupabase()
    const { data, error } = await supabase
      .from('course_purchases')
      .select('customer_name, customer_phone, course_name, purchased_at')
      .in('status', ['verified', 'captured'])
      .order('purchased_at', { ascending: false })
      .limit(8)

    if (error) {
      throw new Error(error.message)
    }

    const buyers = (data || []).map((entry) => ({
      name: cleanName(entry.customer_name || ''),
      city: cityFromPhone(entry.customer_phone || ''),
      course: entry.course_name || 'a course',
      relativeTime: relativeTime(entry.purchased_at),
    }))

    return json({ buyers })
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Unable to fetch recent buyers.' },
      500,
    )
  }
})
