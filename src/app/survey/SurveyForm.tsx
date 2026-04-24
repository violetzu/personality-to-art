'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Markdown from 'react-markdown'
import QuestionItem from '@/components/QuestionItem'
import {
  SELF_ART_PROMPT_MAX_LENGTH,
  SELF_DESCRIPTION_MAX_LENGTH,
  type SurveyConfig,
} from '@/lib/survey-config'

type Section = 'basic' | 'tipi' | 'panas' | 'text'

interface SurveyInitialValues {
  name: string
  age: string
  gender: string
  tipi: number[]
  panas: number[]
  artPrompt: string
  selfDesc: string
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className="bg-brand-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function SurveyForm({
  config,
  initialValues,
}: {
  config: SurveyConfig
  initialValues: SurveyInitialValues | null
}) {
  const router = useRouter()
  const hasInitialValues = Boolean(initialValues)
  const [activeSection, setActiveSection] = useState<Section>(hasInitialValues ? 'text' : 'basic')
  const [reached, setReached] = useState<Set<Section>>(new Set(
    hasInitialValues ? ['basic', 'tipi', 'panas', 'text'] : ['basic']
  ))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState(initialValues?.name ?? '')
  const [age, setAge] = useState(initialValues?.age ?? '')
  const [gender, setGender] = useState(initialValues?.gender ?? '')

  const [tipi, setTipi] = useState<(number | null)[]>(
    initialValues?.tipi ?? Array(config.tipiQuestions.length).fill(null)
  )
  const [panas, setPanas] = useState<(number | null)[]>(
    initialValues?.panas ?? Array(config.panasItems.length).fill(null)
  )

  const [artPrompt, setArtPrompt] = useState(initialValues?.artPrompt ?? '')
  const [selfDesc, setSelfDesc] = useState(initialValues?.selfDesc ?? '')

  const activeTipi = tipi.findIndex(v => v === null)
  const activePanas = panas.findIndex(v => v === null)
  const tipiDone = tipi.every(v => v !== null)
  const panasDone = panas.every(v => v !== null)
  const totalAnswered = tipi.filter(v => v !== null).length + panas.filter(v => v !== null).length
  const totalQuestions = config.tipiQuestions.length + config.panasItems.length

  const basicRef = useRef<HTMLDivElement>(null)
  const tipiRef = useRef<HTMLDivElement>(null)
  const panasRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const refs: Record<Section, React.RefObject<HTMLDivElement | null>> = {
    basic: basicRef, tipi: tipiRef, panas: panasRef, text: textRef,
  }

  function advanceTo(next: Section) {
    setActiveSection(next)
    setReached(prev => new Set([...prev, next]))
    setError('')
    setTimeout(() => refs[next].current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  function focusSection(s: Section) {
    if (activeSection !== s) setActiveSection(s)
  }

  const handleTipiChange = useCallback((i: number, v: number) => {
    setTipi(prev => { const n = [...prev]; n[i] = v; return n })
  }, [])

  const handlePanasChange = useCallback((i: number, v: number) => {
    setPanas(prev => { const n = [...prev]; n[i] = v; return n })
  }, [])

  function toggleTag(tag: string) {
    setSelfDesc(prev => {
      const tags = prev ? prev.split(' ').filter(Boolean) : []
      if (tags.includes(tag)) {
        setError('')
        return tags.filter(t => t !== tag).join(' ')
      }
      const next = [...tags, tag].join(' ')
      if (next.length > SELF_DESCRIPTION_MAX_LENGTH) {
        setError(`自我描述最多 ${SELF_DESCRIPTION_MAX_LENGTH} 字`)
        return prev
      }
      setError('')
      return next
    })
  }

  async function handleSubmit() {
    if (!name.trim()) return setError('請輸入受試者編號')
    if (!age || isNaN(Number(age))) return setError('請輸入年齡')
    if (!gender) return setError('請選擇性別')
    if (!artPrompt.trim()) return setError('請輸入自我意象藝術作品描述')
    if (!selfDesc.trim()) return setError('請輸入自我描述')
    if (artPrompt.trim().length > SELF_ART_PROMPT_MAX_LENGTH) {
      return setError(`自我意象藝術作品最多 ${SELF_ART_PROMPT_MAX_LENGTH} 字`)
    }
    if (selfDesc.trim().length > SELF_DESCRIPTION_MAX_LENGTH) {
      return setError(`自我描述最多 ${SELF_DESCRIPTION_MAX_LENGTH} 字`)
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/participant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), age: Number(age), gender,
          tipi: tipi.map(v => v ?? 3), panas: panas.map(v => v ?? 3),
          selfArtPrompt: artPrompt.trim(), selfDescription: selfDesc.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '儲存失敗')
      router.push(`/generating?id=${data.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '發生錯誤')
      setSubmitting(false)
    }
  }

  function sectionOpacity(s: Section) {
    return activeSection === s ? '' : 'opacity-50'
  }

  return (
    <main className="min-h-screen pb-24">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {activeSection === 'basic' && '基本資料'}
              {activeSection === 'tipi' && '性格量表'}
              {activeSection === 'panas' && '情緒量表'}
              {activeSection === 'text' && '自我描述'}
            </span>
            <span className="text-xs text-gray-400">{totalAnswered} / {totalQuestions}</span>
          </div>
          <ProgressBar current={totalAnswered} total={totalQuestions} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-12">

        {/* ─── Basic Info ─── */}
        {reached.has('basic') && (
          <div ref={basicRef} className={`space-y-6 transition-opacity duration-300 ${sectionOpacity('basic')}`} onClick={() => focusSection('basic')}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">基本資料</h2>
              <p className="text-sm text-gray-500 mt-1">
                {initialValues ? '已載入上一次的填寫內容，你可以直接修改後重新送出。' : config.descriptions.basicSubtitle}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">暱稱</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例：小明"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年齡</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)} min={10} max={100} placeholder="20"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">性別</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white">
                    <option value="">請選擇</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="不願透露">不願透露</option>
                  </select>
                </div>
              </div>
            </div>
            {activeSection === 'basic' && (
              <>
                <button onClick={e => { e.stopPropagation(); if (!name.trim() || !age || !gender) return setError('請完整填寫基本資料'); advanceTo('tipi') }}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors">
                  下一步
                </button>
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              </>
            )}
          </div>
        )}

        {/* ─── TIPI ─── */}
        {reached.has('tipi') && (
          <div ref={tipiRef} className={`transition-opacity duration-300 ${sectionOpacity('tipi')}`} onClick={() => focusSection('tipi')}>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800">性格量表</h2>
              <p className="text-sm text-gray-500 mt-1">{config.descriptions.tipiInstruction}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {config.tipiQuestions.map((q, i) => (
                <QuestionItem key={i} index={i} text={`我是一個${q}人`}
                  value={tipi[i]}
                  active={activeSection === 'tipi' && (i === activeTipi || (tipiDone && i === config.tipiQuestions.length - 1))}
                  answered={tipi[i] !== null}
                  onChange={v => handleTipiChange(i, v)}
                  leftLabel="不符合" rightLabel="符合" />
              ))}
            </div>
            {tipiDone && activeSection === 'tipi' && (
              <button onClick={e => { e.stopPropagation(); advanceTo('panas') }}
                className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors">
                下一步：情緒量表
              </button>
            )}
          </div>
        )}

        {/* ─── PANAS ─── */}
        {reached.has('panas') && (
          <div ref={panasRef} className={`transition-opacity duration-300 ${sectionOpacity('panas')}`} onClick={() => focusSection('panas')}>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-800">情緒量表</h2>
              <p className="text-sm text-gray-500 mt-1">{config.descriptions.panasInstruction}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              {config.panasItems.map((item, i) => (
                <QuestionItem key={i} index={i} text={item.label}
                  value={panas[i]}
                  active={activeSection === 'panas' && (i === activePanas || (panasDone && i === config.panasItems.length - 1))}
                  answered={panas[i] !== null}
                  onChange={v => handlePanasChange(i, v)}
                  leftLabel="非常輕微" rightLabel="非常強烈" />
              ))}
            </div>
            {panasDone && activeSection === 'panas' && (
              <button onClick={e => { e.stopPropagation(); advanceTo('text') }}
                className="w-full mt-6 bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors">
                下一步：自我描述
              </button>
            )}
          </div>
        )}

        {/* ─── Text ─── */}
        {reached.has('text') && (
          <div ref={textRef} className={`space-y-6 transition-opacity duration-300 ${sectionOpacity('text')}`} onClick={() => focusSection('text')}>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800">自我描述</h2>
              <p className="text-sm text-gray-500 mt-1">{config.descriptions.textSubtitle}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <label className="block text-sm font-medium text-gray-800">自我意象藝術作品</label>
              <p className="text-xs text-gray-500">{config.descriptions.artPromptInstruction}</p>
              <p className="text-xs text-gray-400 text-right">
                {artPrompt.length} / {SELF_ART_PROMPT_MAX_LENGTH}
              </p>
              <div className="bg-brand-50 rounded-xl p-4 text-xs prose prose-xs max-w-none prose-p:my-1 prose-headings:text-gray-700 prose-headings:font-medium prose-headings:text-xs prose-headings:my-1 prose-ul:my-1 prose-li:my-0 prose-li:text-gray-500 prose-em:text-gray-400 prose-strong:text-gray-700 prose-hr:border-brand-200 prose-hr:my-3">
                <Markdown>{config.descriptions.artPromptHints}</Markdown>
              </div>
              <textarea
                value={artPrompt}
                onChange={e => {
                  setArtPrompt(e.target.value)
                  setError('')
                }}
                rows={5}
                maxLength={SELF_ART_PROMPT_MAX_LENGTH}
                placeholder="請描述你的作品..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
              <label className="block text-sm font-medium text-gray-800">自我描述</label>
              <p className="text-xs text-gray-500">{config.descriptions.selfDescInstruction}</p>
              <p className="text-xs text-gray-400 text-right">
                {selfDesc.length} / {SELF_DESCRIPTION_MAX_LENGTH}
              </p>
              <div className="space-y-3">
                {config.quickTags.map(({ category, tags }) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-gray-400 mb-1.5">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => {
                        const selected = selfDesc.split(' ').includes(tag)
                        return (
                          <button key={tag} type="button" onClick={e => { e.stopPropagation(); toggleTag(tag) }}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${selected ? 'bg-brand-100 border-brand-400 text-brand-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <input
                type="text"
                value={selfDesc}
                onChange={e => {
                  setSelfDesc(e.target.value)
                  setError('')
                }}
                maxLength={SELF_DESCRIPTION_MAX_LENGTH}
                placeholder="或直接輸入..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button onClick={e => { e.stopPropagation(); handleSubmit() }} disabled={submitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors">
              {submitting ? '儲存中...' : '完成，開始生成藝術作品'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
