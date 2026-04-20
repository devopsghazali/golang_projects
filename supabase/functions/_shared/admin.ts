import { safeEqual } from './crypto.ts'

// The admin token is a long random string held ONLY in Supabase function
// secrets. It never ships to the browser bundle. Frontend admin users
// paste it into the /admin login form; it's kept in sessionStorage and
// attached as `x-admin-token` to every admin_coupons call.
export function assertAdmin(request: Request): string {
  const expected = Deno.env.get('ADMIN_API_TOKEN') || ''
  if (!expected || expected.length < 16) {
    throw new AdminAuthError(
      'Admin API token is not configured on the server.',
      500,
    )
  }

  const received = (request.headers.get('x-admin-token') || '').trim()
  if (!received) {
    throw new AdminAuthError('Missing admin token.', 401)
  }

  if (received.length !== expected.length || !safeEqual(received, expected)) {
    throw new AdminAuthError('Invalid admin token.', 401)
  }

  const actor = (request.headers.get('x-admin-actor') || 'admin').trim()
  return actor.slice(0, 120) || 'admin'
}

export class AdminAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
