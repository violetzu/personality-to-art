import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE = 'eq_admin'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && pathname !== '/admin') {
    if (!req.cookies.get(ADMIN_COOKIE)?.value) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
