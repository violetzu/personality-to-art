import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 藝術創作與心理研究',
  description: '心理量表與 AI 藝術創作研究平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
