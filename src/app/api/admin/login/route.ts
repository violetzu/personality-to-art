import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { setAdminCookie } from '@/lib/auth'
import { checkLoginAttempt, recordLoginFailure, recordLoginSuccess } from '@/lib/rate-limit'

function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  const a = Buffer.from(input)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  const { allowed, remaining } = checkLoginAttempt(ip)
  if (!allowed) {
    return NextResponse.json({ ok: false, error: `帳號已鎖定，請 ${remaining} 秒後再試` }, { status: 429 })
  }

  const { password } = await req.json()
  if (!checkPassword(String(password ?? ''))) {
    recordLoginFailure(ip)
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  recordLoginSuccess(ip)
  await setAdminCookie()
  return NextResponse.json({ ok: true })
}
