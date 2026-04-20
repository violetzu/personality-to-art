'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PromptRecord {
  id: number
  promptText: string
  imageUrl: string
  createdAt: string
}

const REGENERATING_MESSAGES = [
  '正在重新構圖...',
  '正在鋪陳色彩...',
  '正在刻畫細節...',
]

function ResultContent() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params.get('id')
  const token = params.get('token')
  const accessToken = token ?? ''
  const [prompt, setPrompt] = useState<PromptRecord | null>(null)
  const [maxRetries, setMaxRetries] = useState(3)
  const [retriesUsed, setRetriesUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regeneratingMessageIndex, setRegeneratingMessageIndex] = useState(0)

  useEffect(() => {
    if (!id || !accessToken) return
    fetch(`/api/participant/${id}/latest-prompt?token=${encodeURIComponent(accessToken)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error && !data.imageMissing) throw new Error(data.error)
        setPrompt(data.prompt ?? null)
        setMaxRetries(data.maxRetries ?? 3)
        setRetriesUsed(data.retriesUsed ?? 0)
        setError(data.imageMissing ? (data.error ?? '找不到已保存的作品檔案，請重新生成作品') : '')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [accessToken, id])

  useEffect(() => {
    if (!regenerating) {
      setRegeneratingMessageIndex(0)
      return
    }
    const interval = window.setInterval(() => {
      setRegeneratingMessageIndex(i => (i + 1) % REGENERATING_MESSAGES.length)
    }, 1800)
    return () => window.clearInterval(interval)
  }, [regenerating])

  async function confirm() {
    setConfirming(true)
    const img = prompt?.imageUrl ? `&img=${encodeURIComponent(prompt.imageUrl)}` : ''
    router.push(`/done?id=${id}${img}`)
  }

  async function regenerate() {
    if (retriesUsed >= maxRetries) return
    setRegenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: Number(id), token: accessToken }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setPrompt(data.prompt)
      setRetriesUsed(v => v + 1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '重新生成失敗')
    } finally {
      setRegenerating(false)
    }
  }

  if (!id || !accessToken) { router.replace('/'); return null }

  const retriesLeft = maxRetries - retriesUsed

  return (
    <main className="min-h-screen pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">您的專屬藝術作品</h1>
          <p className="text-sm text-gray-500 mt-1">AI 根據您的心理輪廓創作</p>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-red-500">{error}</div>
        )}

        {prompt && (
          <div className="space-y-5">
            <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={prompt.imageUrl}
                alt="AI generated artwork"
                onError={() => {
                  setPrompt(null)
                  setError('找不到已保存的作品檔案，請重新生成作品')
                }}
                className={`w-full object-contain max-h-[600px] bg-gray-50 transition-all duration-500 ${
                  regenerating ? 'scale-[1.02] blur-[2px] opacity-40' : ''
                }`}
              />
              {regenerating && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/65 backdrop-blur-sm">
                  <div className="w-full max-w-xs mx-6 rounded-3xl border border-white/70 bg-white/80 shadow-xl px-6 py-7 text-center">
                    <div className="relative flex justify-center items-center h-24 mb-4">
                      <div className="art-orbit-dot art-orbit-dot-delay-1" />
                      <div className="art-orbit-dot art-orbit-dot-delay-2" />
                      <div className="art-orbit-dot art-orbit-dot-delay-3" />
                      <div className="absolute w-24 h-24 rounded-full border border-brand-200/80" />
                      <div className="absolute w-16 h-16 rounded-full border border-brand-300/70 animate-pulse" />
                      <div className="absolute w-3 h-3 rounded-full bg-brand-500 shadow-[0_0_24px_rgba(168,85,247,0.25)]" />
                    </div>
                    <p className="text-base font-semibold text-gray-800">正在重新生成作品</p>
                    <p
                      key={regeneratingMessageIndex}
                      className="mt-2 text-sm text-gray-500 transition-opacity duration-500"
                    >
                      {REGENERATING_MESSAGES[regeneratingMessageIndex]}
                    </p>
                    <p className="mt-4 text-xs text-gray-400">請稍候，新的畫面完成後會自動更新</p>
                  </div>
                </div>
              )}
              <div className="p-4">
                <p className="text-xs text-gray-400 font-mono leading-relaxed">{prompt.promptText}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirm}
                disabled={confirming}
                className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors"
              >
                {confirming ? '儲存中...' : '確認此作品'}
              </button>

              {retriesLeft > 0 && (
                <button
                  onClick={regenerate}
                  disabled={regenerating}
                  className="flex-1 border border-gray-200 hover:border-brand-400 text-gray-700 hover:text-brand-700 font-medium py-3 rounded-xl transition-colors"
                >
                  {regenerating ? '重新生成中...' : `重新生成（剩 ${retriesLeft} 次）`}
                </button>
              )}
            </div>
          </div>
        )}

        {!loading && !prompt && retriesLeft > 0 && (
          <div className="flex justify-center">
            <button
              onClick={regenerate}
              disabled={regenerating}
              className="w-full max-w-sm border border-gray-200 hover:border-brand-400 text-gray-700 hover:text-brand-700 font-medium py-3 rounded-xl transition-colors"
            >
              {regenerating ? '重新生成中...' : `重新生成（剩 ${retriesLeft} 次）`}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" /></div>}>
      <ResultContent />
    </Suspense>
  )
}
