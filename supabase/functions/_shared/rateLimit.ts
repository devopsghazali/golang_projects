// Simple in-memory sliding-window rate limiter, scoped per edge-function instance.
// Good enough for abuse prevention on a single-region Supabase deployment.
// For multi-region / hard enforcement, move to a Redis / DB-backed counter.

type Bucket = { count: number; resetAt: number }

const store: Map<string, Bucket> = (globalThis as any).__cpamaster_rate_store__
  || new Map<string, Bucket>()
;(globalThis as any).__cpamaster_rate_store__ = store

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs }
    store.set(key, bucket)
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  }
}

export function clientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real
  const cf = request.headers.get('cf-connecting-ip')
  if (cf) return cf
  return 'unknown'
}
