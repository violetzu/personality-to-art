'use client'

import { useState } from 'react'
import Markdown from 'react-markdown'
import {
  DIMENSION_LABELS,
  type TipiScoring, type TagCategory, type SurveyDescriptions,
} from '@/lib/survey-config'
import type { Settings } from '../_types'

interface SettingsTabProps {
  settings: Settings
  setSettings: (fn: (prev: Settings) => Settings) => void
  onSave: () => Promise<void>
}

export default function SettingsTab({ settings, setSettings, onSave }: SettingsTabProps) {
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState<Record<number, string>>({})
  const [hintsPreview, setHintsPreview] = useState(false)

  const { maxRetries, fluxSteps, tipiQuestions, tipiScoring, panasItems, descriptions, quickTags } = settings

  async function handleSave() {
    setSaving(true)
    await onSave()
    setSaving(false)
  }

  function setTipiQuestion(i: number, v: string) {
    setSettings(p => { const q = [...p.tipiQuestions]; q[i] = v; return { ...p, tipiQuestions: q } })
  }
  function setTipiScoring(i: number, patch: Partial<TipiScoring>) {
    setSettings(p => { const s = [...p.tipiScoring]; s[i] = { ...s[i], ...patch }; return { ...p, tipiScoring: s } })
  }
  function setPanasLabel(i: number, label: string) {
    setSettings(p => { const items = [...p.panasItems]; items[i] = { ...items[i], label }; return { ...p, panasItems: items } })
  }
  function setDescription(key: keyof SurveyDescriptions, v: string) {
    setSettings(p => ({ ...p, descriptions: { ...p.descriptions, [key]: v } }))
  }
  function addTag(ci: number) {
    const t = (newTag[ci] ?? '').trim()
    if (!t) return
    setSettings(p => {
      const tags = [...p.quickTags]
      tags[ci] = { ...tags[ci], tags: [...tags[ci].tags, t] }
      return { ...p, quickTags: tags }
    })
    setNewTag(prev => ({ ...prev, [ci]: '' }))
  }
  function removeTag(ci: number, tag: string) {
    setSettings(p => {
      const tags = [...p.quickTags]
      tags[ci] = { ...tags[ci], tags: tags[ci].tags.filter(t => t !== tag) }
      return { ...p, quickTags: tags }
    })
  }
  function setCategoryName(ci: number, name: string) {
    setSettings(p => {
      const tags = [...p.quickTags]; tags[ci] = { ...tags[ci], category: name }; return { ...p, quickTags: tags }
    })
  }
  function removeCategory(ci: number) {
    setSettings(p => ({ ...p, quickTags: p.quickTags.filter((_, i) => i !== ci) }))
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* 系統參數 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">系統參數</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">每人最大重繪次數</label>
          <input type="number" min={0} max={20} value={maxRetries}
            onChange={e => setSettings(p => ({ ...p, maxRetries: Number(e.target.value) }))}
            className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">FLUX 推理步數（Steps）</label>
          <input type="number" min={1} max={50} value={fluxSteps}
            onChange={e => setSettings(p => ({ ...p, fluxSteps: Number(e.target.value) }))}
            className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
        </div>
      </div>

      {/* 說明文字 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-gray-800">問卷說明文字</h3>
        {(
          [
            { key: 'basicSubtitle', label: '基本資料區塊說明' },
            { key: 'tipiInstruction', label: '性格量表說明' },
            { key: 'panasInstruction', label: '情緒量表說明' },
            { key: 'textSubtitle', label: '自我描述區塊說明' },
            { key: 'artPromptInstruction', label: '自我意象藝術作品說明' },
            { key: 'selfDescInstruction', label: '自我描述輸入說明' },
          ] as { key: keyof SurveyDescriptions; label: string }[]
        ).map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <textarea
              value={descriptions[key]}
              onChange={e => setDescription(key, e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>
        ))}

        {/* artPromptHints — markdown editor with preview */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500">藝術作品提示區塊（Markdown）</label>
            <button
              type="button"
              onClick={() => setHintsPreview(p => !p)}
              className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-brand-400 hover:text-brand-700 transition-colors"
            >
              {hintsPreview ? '編輯' : '預覽'}
            </button>
          </div>
          {hintsPreview ? (
            <div className="border border-gray-200 rounded-lg px-3 py-2 text-xs min-h-[8rem] bg-brand-50 prose prose-xs max-w-none prose-p:my-1 prose-headings:text-gray-700 prose-headings:font-medium prose-headings:text-xs prose-headings:my-1 prose-ul:my-1 prose-li:my-0 prose-li:text-gray-500 prose-em:text-gray-400 prose-strong:text-gray-700 prose-hr:border-brand-200 prose-hr:my-3">
              <Markdown>{descriptions.artPromptHints}</Markdown>
            </div>
          ) : (
            <textarea
              value={descriptions.artPromptHints}
              onChange={e => setDescription('artPromptHints', e.target.value)}
              rows={12}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400 resize-y"
            />
          )}
        </div>
      </div>

      {/* TIPI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">性格量表（TIPI）題目與計分</h3>
          <p className="text-xs text-gray-400 mt-1">正向：得分直接計入；負向：得分反向計算（6 − 分數）</p>
        </div>
        <div className="space-y-2">
          {tipiQuestions.map((q, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
              <input value={q} onChange={e => setTipiQuestion(i, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              <select
                value={tipiScoring[i].dimension}
                onChange={e => setTipiScoring(i, { dimension: e.target.value as TipiScoring['dimension'] })}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              >
                {Object.entries(DIMENSION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{k} {v}</option>
                ))}
              </select>
              <button
                onClick={() => setTipiScoring(i, { reverse: !tipiScoring[i].reverse })}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                  tipiScoring[i].reverse ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'
                }`}
              >
                {tipiScoring[i].reverse ? '負向' : '正向'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PANAS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">情緒量表（PANAS）題目</h3>
          <p className="text-xs text-gray-400 mt-1">修改標籤後，舊有畫作分析需重新分析才能對應新標籤</p>
        </div>
        <div className="space-y-2">
          {panasItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
              <input value={item.label} onChange={e => setPanasLabel(i, e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tags */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">自我描述快速標籤</h3>
          <button
            onClick={() => setSettings(p => ({ ...p, quickTags: [...p.quickTags, { category: '新分類', tags: [] }] }))}
            className="text-xs px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg hover:bg-brand-100"
          >
            ＋ 新增分類
          </button>
        </div>
        <div className="space-y-5">
          {quickTags.map((cat: TagCategory, ci: number) => (
            <div key={ci} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input value={cat.category} onChange={e => setCategoryName(ci, e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400"
                  placeholder="分類名稱" />
                <button onClick={() => removeCategory(ci)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5">
                  刪除分類
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 text-xs bg-brand-50 border border-brand-200 text-brand-700 px-2.5 py-1 rounded-full">
                    {tag}
                    <button onClick={() => removeTag(ci, tag)} className="text-brand-400 hover:text-red-500 leading-none">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTag[ci] ?? ''}
                  onChange={e => setNewTag(prev => ({ ...prev, [ci]: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') addTag(ci) }}
                  placeholder="新增標籤（Enter 確認）"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button onClick={() => addTag(ci)} className="px-3 py-1.5 bg-brand-600 text-white text-xs rounded-lg hover:bg-brand-700">
                  新增
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-colors text-sm">
        {saving ? '儲存中...' : '儲存所有設定'}
      </button>
    </div>
  )
}
