import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin } from '@/lib/origin'

export async function POST(req: NextRequest) {
  const blocked = checkOrigin(req)
  if (blocked) return blocked

  return NextResponse.json({ ok: true })
}
