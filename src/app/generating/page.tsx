'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const MESSAGES = [
  '正在分析您的心理輪廓...',
  '整合性格與情緒資料...',
  '生成藝術提示詞...',
  '正在繪圖...',
  '正在完成圖像細節...',
  '最後潤飾中...',
]

function GeneratingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get('id')
  const token = params.get('token')
  const accessToken = token ?? ''
  const [msgIndex, setMsgIndex] = useState(0)
  const [error, setError] = useState('')
  const called = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!id || !accessToken || called.current) return
    called.current = true

    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId: Number(id), token: accessToken }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        router.replace(`/result?id=${id}&token=${encodeURIComponent(accessToken)}`)
      })
      .catch(e => setError(e.message ?? '生成失敗'))
  }, [accessToken, id, router])

  if (!id || !accessToken) {
    router.replace('/')
    return null
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {error ? (
          <div className="space-y-4">
            <div className="text-4xl">⚠️</div>
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={() => { setError(''); called.current = false }}
              className="mt-4 px-6 py-2 bg-brand-600 text-white rounded-xl text-sm hover:bg-brand-700 transition-colors"
            >
              重試
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Spinner */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-transparent border-t-green-400 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">正在創作您的專屬畫作</h2>
              <p
                key={msgIndex}
                className="text-sm text-gray-500 transition-opacity duration-500"
              >
                {MESSAGES[msgIndex]}
              </p>
            </div>

            <p className="text-xs text-gray-400">這可能需要 30 秒至 2 分鐘，請耐心等候</p>
          </div>
        )}
      </div>
    </main>
  )
}

export default function GeneratingPage() {
  return (
    <Suspense>
      <GeneratingContent />
    </Suspense>
  )
}
