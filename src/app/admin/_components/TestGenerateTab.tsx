'use client'

import { useState } from 'react'

async function readApiResponse(res: Response): Promise<{ error?: string; url?: string }> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return await res.json()
  }

  const text = await res.text()
  return text ? { error: text } : {}
}

export default function TestGenerateTab() {
  const [prompt, setPrompt] = useState('')
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [steps, setSteps] = useState(28)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<{ url: string; prompt: string }[]>([])

  async function handleGenerate() {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/admin/test-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), width, height, steps }),
      })
      const data = await readApiResponse(res)
      if (!res.ok) throw new Error(data.error ?? '生成失敗')
      if (!data.url) throw new Error('生成成功但未收到圖片網址')
      const url = data.url
      setResult(url)
      setHistory(prev => [{ url, prompt }, ...prev].slice(0, 20))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">直接提示詞生圖</h3>

        <div>
          <label className="block text-sm text-gray-600 mb-1">提示詞</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="輸入英文提示詞..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none font-mono"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">寬度</label>
            <select value={width} onChange={e => setWidth(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white">
              {[512, 768, 1024, 1280].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">高度</label>
            <select value={height} onChange={e => setHeight(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white">
              {[512, 768, 1024, 1280].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Steps</label>
            <input type="number" min={1} max={50} value={steps}
              onChange={e => setSteps(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl transition-colors text-sm">
          {loading ? '生成中...' : '生成'}
        </button>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result} alt="generated" className="w-full object-contain max-h-[600px] bg-gray-50" />
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-mono truncate flex-1 mr-4">{prompt}</p>
            <a href={result} download className="text-xs text-brand-600 hover:underline shrink-0">下載</a>
          </div>
        </div>
      )}

      {history.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-600">本次歷史（{history.length - 1} 張）</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {history.slice(1).map((h, i) => (
              <div key={i} className="space-y-1 cursor-pointer"
                onClick={() => { setResult(h.url); setPrompt(h.prompt) }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.url} alt="" className="w-full aspect-square object-cover rounded-lg bg-gray-50" />
                <p className="text-xs text-gray-400 truncate">{h.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
