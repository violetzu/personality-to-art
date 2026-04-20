import type { NextConfig } from 'next'

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ?.split(',')
  .map(value => value.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins,
  async headers() {
    if (process.env.NODE_ENV !== 'production') return []
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
