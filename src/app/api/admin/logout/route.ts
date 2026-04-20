import { NextResponse } from 'next/server'
import { clearAdminCookie, hasAdmin } from '@/lib/auth'

export async function POST() {
  if (!await hasAdmin()) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  await clearAdminCookie()
  return NextResponse.json({ ok: true })
}
