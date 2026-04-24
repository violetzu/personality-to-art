// WARNING: in-memory only — resets on process restart and is not shared across
// multiple processes or containers. For multi-instance deployments, replace both
// Maps with a shared store (e.g. Redis) to maintain rate-limit guarantees.

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

// Track failed login attempts with lockout
interface LockoutEntry {
  failures: number
  lockedUntil: number
}

const loginStore = new Map<string, LockoutEntry>()

const MAX_FAILURES = 5
const LOCKOUT_MS = 15 * 60 * 1000

export function checkLoginAttempt(ip: string): { allowed: boolean; remaining?: number } {
  const now = Date.now()
  const entry = loginStore.get(ip)

  if (!entry) return { allowed: true }

  if (entry.lockedUntil > now) {
    return { allowed: false, remaining: Math.ceil((entry.lockedUntil - now) / 1000) }
  }

  if (entry.failures >= MAX_FAILURES && entry.lockedUntil <= now) {
    loginStore.delete(ip)
  }

  return { allowed: true }
}

export function recordLoginFailure(ip: string): void {
  const entry = loginStore.get(ip) ?? { failures: 0, lockedUntil: 0 }
  entry.failures++
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS
  }
  loginStore.set(ip, entry)
}

export function recordLoginSuccess(ip: string): void {
  loginStore.delete(ip)
}
