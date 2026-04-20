import { NextResponse } from 'next/server'
import { hasAdmin } from '@/lib/auth'

export async function GET() {
  return NextResponse.json({ ok: await hasAdmin() })
}
