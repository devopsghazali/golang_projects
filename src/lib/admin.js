import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

const TOKEN_KEY = 'cpamaster-admin-token'
const ACTOR_KEY = 'cpamaster-admin-actor'

export function getAdminToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function getAdminActor() {
  try {
    return sessionStorage.getItem(ACTOR_KEY) || 'admin'
  } catch {
    return 'admin'
  }
}

export function setAdminCredentials({ token, actor }) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token || '')
    if (actor) sessionStorage.setItem(ACTOR_KEY, actor)
  } catch {
    // sessionStorage unavailable — still works for the current tab via memory fallback
  }
}

export function clearAdminCredentials() {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(ACTOR_KEY)
  } catch {
    // ignore
  }
}

export async function adminRequest(action, payload = {}) {
  const token = getAdminToken()
  if (!token) {
    const error = new Error('Admin token missing. Please sign in again.')
    error.code = 'UNAUTHENTICATED'
    throw error
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin_coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      'x-admin-token': token,
      'x-admin-actor': getAdminActor(),
    },
    body: JSON.stringify({ action, ...payload }),
  })

  const data = await response.json().catch(() => null)

  if (response.status === 401) {
    const error = new Error(data?.error || 'Unauthorized. Please sign in again.')
    error.code = 'UNAUTHENTICATED'
    throw error
  }

  if (!response.ok) {
    throw new Error(data?.error || `Admin ${action} failed.`)
  }

  return data
}
