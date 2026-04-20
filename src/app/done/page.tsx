'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function DoneContent() {
  const params = useSearchParams()
  const imageUrl = params.get('img')

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-sm space-y-6">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800">感謝您的參與！</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          您的資料已成功記錄，您的專屬藝術作品也已儲存。<br />
          感謝您協助本研究！
        </p>

        {imageUrl && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="您的專屬藝術作品"
              className="w-full object-contain bg-gray-50"
            />
          </div>
        )}

        <div className="flex flex-col gap-3">
          {imageUrl && (
            <a
              href={imageUrl}
              download="artwork.png"
              className="inline-block px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl transition-colors"
            >
              下載作品
            </a>
          )}
          <Link
            href="/"
            className="inline-block px-8 py-3 border border-gray-200 hover:border-brand-400 text-gray-600 hover:text-brand-700 font-medium rounded-xl transition-colors"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function DonePage() {
  return (
    <Suspense fallback={null}>
      <DoneContent />
    </Suspense>
  )
}
