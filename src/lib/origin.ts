import { NextRequest, NextResponse } from 'next/server'

export function checkOrigin(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null

  const allowedOrigin = process.env.APP_ORIGIN?.replace(/\/$/, '')
  if (!allowedOrigin) return null

  const origin = req.headers.get('origin')
  if (!origin || origin !== allowedOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
