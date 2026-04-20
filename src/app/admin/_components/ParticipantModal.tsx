'use client'

import { useState } from 'react'
import type { DetailParticipant } from '../_types'
import type { PanasItem } from '@/lib/survey-config'

interface ParticipantModalProps {
  detail: DetailParticipant
  tipiQuestions: string[]
  panasItems: PanasItem[]
  onClose: () => void
  onDelete: (id: number) => void
}

const BF_KEYS = ['extraversion', 'agreeableness', 'conscientiousness', 'stability', 'openness'] as const
const BF_LABELS: Record<string, string> = {
  extraversion: '外向性', agreeableness: '親和性',
  conscientiousness: '盡責性', stability: '穩定性', openness: '開放性',
}
const TIPI_KEYS = ['tipi1','tipi2','tipi3','tipi4','tipi5','tipi6','tipi7','tipi8','tipi9','tipi10'] as const

export default function ParticipantModal({ detail, tipiQuestions, panasItems, onClose, onDelete }: ParticipantModalProps) {
  const [prompts, setPrompts] = useState(detail.prompts)
  const [analyzingId, setAnalyzingId] = useState<number | null>(null)

  function parseAnalysis(raw: string | null) {
    if (!raw) return null
    try {
      return JSON.parse(raw) as {
        description: string
        analyzedAt: string
        bigFive: Record<string, number>
        panas: Record<string, number>
      }
    } catch {
      return null
    }
  }

  async function analyzePrompt(promptId: number) {
    setAnalyzingId(promptId)
    try {
      const res = await fetch(`/api/admin/analyze/${promptId}`, { method: 'POST' })
      if (!res.ok) return
      const { analysis } = await res.json()
      setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, analysis: JSON.stringify(analysis) } : p))
    } finally {
      setAnalyzingId(null)
    }
  }

  const panasActual: Record<string, number> = {
    active: detail.panasActive, nervous: detail.panasNervous, happy: detail.panasHappy,
    anxious: detail.panasAnxious, energetic: detail.panasEnergetic, upset: detail.panasUpset,
    excited: detail.panasExcited, afraid: detail.panasAfraid, interested: detail.panasInterested,
    distressed: detail.panasDistressed, inspired: detail.panasInspired, stressed: detail.panasStressed,
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-4xl my-8 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">受試者詳細資料 — {detail.name}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (confirm('確定刪除此受試者所有資料？')) onDelete(detail.id) }}
              className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
            >
              刪除
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">基本資料</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">年齡：</span>{detail.age}</p>
                <p><span className="text-gray-500">性別：</span>{detail.gender}</p>
                <p><span className="text-gray-500">時間：</span>{new Date(detail.createdAt).toLocaleString('zh-TW')}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Big Five</h3>
              <div className="grid grid-cols-5 gap-2 text-center">
                {[['E', detail.extraversion], ['A', detail.agreeableness], ['C', detail.conscientiousness], ['S', detail.stability], ['O', detail.openness]].map(([k, v]) => (
                  <div key={k as string} className="bg-brand-50 rounded-lg py-2">
                    <div className="text-xs text-gray-500">{k as string}</div>
                    <div className="font-bold text-brand-700">{(v as number).toFixed(1)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">TIPI 原始分</h3>
              <div className="space-y-1">
                {tipiQuestions.map((label, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-500 truncate max-w-[200px]">{i + 1}. {label}</span>
                    <span className="font-medium text-gray-700 ml-2">{detail[TIPI_KEYS[i]]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">PANAS 情緒</h3>
              <div className="space-y-1">
                {panasItems.map(item => (
                  <div key={item.key} className="flex justify-between text-xs">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-700">{panasActual[item.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">自我描述</h3>
              <p className="text-sm bg-gray-50 rounded-xl p-3">{detail.selfDescription || '—'}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">自我意象藝術作品</h3>
              <p className="text-sm bg-gray-50 rounded-xl p-3 leading-relaxed">{detail.selfArtPrompt || '—'}</p>
            </div>

            {prompts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">生成作品</h3>
                <div className="space-y-4">
                  {prompts.map(pr => {
                    const analysis = parseAnalysis(pr.analysis)
                    return (
                      <div key={pr.id} className="border border-gray-100 rounded-xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={pr.imageUrl} alt="artwork" className="w-full object-contain max-h-64 bg-gray-50" />
                        <div className="p-3 space-y-3">
                          <p className="text-xs text-gray-400 font-mono leading-relaxed">{pr.promptText}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-300">{new Date(pr.createdAt).toLocaleString('zh-TW')}</p>
                            <button
                              onClick={() => analyzePrompt(pr.id)}
                              disabled={analyzingId === pr.id}
                              className="text-xs px-3 py-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                            >
                              {analyzingId === pr.id ? '分析中...' : analysis ? '重新分析' : '分析畫作'}
                            </button>
                          </div>

                          {analysis && (
                            <div className="border-t border-gray-100 pt-3 space-y-3">
                              <p className="text-xs text-gray-600 italic">{analysis.description}</p>

                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Big Five 比對（推斷 vs 實際）</p>
                                <div className="space-y-1">
                                  {BF_KEYS.map(k => (
                                    <div key={k} className="flex items-center gap-2 text-xs">
                                      <span className="w-16 text-gray-500 shrink-0">{BF_LABELS[k]}</span>
                                      <div className="flex-1 flex items-center gap-1">
                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                          <div className="bg-brand-400 h-1.5 rounded-full" style={{ width: `${(analysis.bigFive[k] / 5) * 100}%` }} />
                                        </div>
                                        <span className="w-6 text-center text-brand-600 font-medium">{analysis.bigFive[k].toFixed(1)}</span>
                                        <span className="text-gray-300">vs</span>
                                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                          <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: `${((detail[k] as number) / 5) * 100}%` }} />
                                        </div>
                                        <span className="w-6 text-center text-gray-500 font-medium">{(detail[k] as number).toFixed(1)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">PANAS 比對（推斷 vs 實際）</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  {panasItems.map(item => (
                                    <div key={item.key} className="flex items-center gap-1 text-xs">
                                      <span className="w-20 text-gray-500 shrink-0">{item.label}</span>
                                      <span className="text-brand-600 font-medium">{analysis.panas[item.key]?.toFixed(1) ?? '—'}</span>
                                      <span className="text-gray-300 text-xs">vs</span>
                                      <span className="text-gray-500 font-medium">{panasActual[item.key]}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <p className="text-xs text-gray-300">分析時間：{new Date(analysis.analyzedAt).toLocaleString('zh-TW')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
