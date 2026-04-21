'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DEFAULT_TIPI_QUESTIONS, DEFAULT_TIPI_SCORING, DEFAULT_PANAS_ITEMS,
  DEFAULT_QUICK_TAGS, DEFAULT_DESCRIPTIONS,
} from '@/lib/survey-config'
import type { Participant, DetailParticipant, Stats, Settings } from './_types'
import LoginScreen from './_components/LoginScreen'
import StatsCards from './_components/StatsCards'
import ParticipantTable from './_components/ParticipantTable'
import TestGenerateTab from './_components/TestGenerateTab'
import SettingsTab from './_components/SettingsTab'
import ParticipantModal from './_components/ParticipantModal'

const DEFAULT_SETTINGS: Settings = {
  maxRetries: 3,
  fluxSteps: 4,
  tipiQuestions: DEFAULT_TIPI_QUESTIONS,
  tipiScoring: DEFAULT_TIPI_SCORING,
  panasItems: DEFAULT_PANAS_ITEMS,
  descriptions: DEFAULT_DESCRIPTIONS,
  quickTags: DEFAULT_QUICK_TAGS,
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsError, setParticipantsError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<DetailParticipant | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState<'list' | 'generate' | 'settings'>('list')
  const requestSeq = useRef(0)

  const loadData = useCallback(async (q = '') => {
    const reqId = ++requestSeq.current
    setParticipantsLoading(true)
    setParticipantsError('')

    const [pRes, sRes, setRes] = await Promise.allSettled([
      fetch(`/api/admin/participants?search=${encodeURIComponent(q)}`),
      fetch('/api/admin/stats'),
      fetch('/api/admin/settings'),
    ])

    if (reqId !== requestSeq.current) return

    if (pRes.status === 'fulfilled') {
      if (pRes.value.status === 401) {
        setAuthed(false)
        return
      }
      if (pRes.value.ok) {
        const pData = await pRes.value.json()
        setParticipants(pData.participants ?? [])
      } else {
        setParticipantsError('受試者列表讀取失敗')
      }
    } else {
      setParticipantsError('受試者列表讀取失敗')
    }

    if (sRes.status === 'fulfilled' && sRes.value.ok) {
      const sData = await sRes.value.json()
      if (sData.stats) setStats(sData.stats)
    }

    if (setRes.status === 'fulfilled' && setRes.value.ok) {
      const setData = await setRes.value.json()
      setSettings({
        maxRetries: setData.maxRetries ?? 3,
        fluxSteps: setData.fluxSteps ?? 28,
        tipiQuestions: setData.tipiQuestions ?? DEFAULT_TIPI_QUESTIONS,
        tipiScoring: setData.tipiScoring ?? DEFAULT_TIPI_SCORING,
        panasItems: setData.panasItems ?? DEFAULT_PANAS_ITEMS,
        descriptions: setData.descriptions ?? DEFAULT_DESCRIPTIONS,
        quickTags: setData.quickTags ?? DEFAULT_QUICK_TAGS,
      })
    }

    setParticipantsLoading(false)
  }, [])

  useEffect(() => {
    if (!authed) return
    const timer = window.setTimeout(() => {
      loadData(search)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [authed, loadData, search])

  useEffect(() => {
    fetch('/api/admin/check').then(r => r.json()).then(d => {
      if (d.ok) { setAuthed(true); loadData() }
    })
  }, [loadData])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await res.json()
    if (data.ok) { setAuthed(true); loadData() }
    else setLoginError(data.error ?? '密碼錯誤')
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/admin/participants/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    loadData(search)
    if (detail?.id === id) setDetail(null)
  }

  async function viewDetail(id: number) {
    const res = await fetch(`/api/admin/participants/${id}`)
    if (!res.ok) return
    const data = await res.json()
    if (data.participant) setDetail(data.participant)
  }

  async function saveSettings() {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
  }

  if (!authed) {
    return <LoginScreen password={password} setPassword={setPassword} loginError={loginError} onSubmit={handleLogin} />
  }

  return (
    <main className="min-h-screen pb-16">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="font-bold text-gray-800">管理員後台</h1>
          <div className="flex gap-2">
            <a href="/api/admin/export"
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl hover:border-brand-400 text-gray-600 hover:text-brand-700 transition-colors">
              匯出 CSV
            </a>
            <button
              onClick={() => fetch('/api/admin/logout', { method: 'POST' }).then(() => setAuthed(false))}
              className="text-sm px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:text-red-500 transition-colors">
              登出
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {stats && <StatsCards stats={stats} />}

        <div className="flex gap-1 border-b border-gray-100">
          {([['list', '受試者列表'], ['generate', '測試生圖'], ['settings', '系統設定']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab ? 'border-brand-500 text-brand-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <ParticipantTable
            participants={participants}
            search={search}
            loading={participantsLoading}
            error={participantsError}
            onSearch={setSearch}
            onViewDetail={viewDetail}
            onDelete={handleDelete}
          />
        )}
        {activeTab === 'generate' && <TestGenerateTab defaultSteps={settings.fluxSteps} />}
        {activeTab === 'settings' && (
          <SettingsTab settings={settings} setSettings={setSettings} onSave={saveSettings} />
        )}
      </div>

      {detail && (
        <ParticipantModal
          detail={detail}
          tipiQuestions={settings.tipiQuestions}
          panasItems={settings.panasItems}
          onClose={() => setDetail(null)}
          onDelete={handleDelete}
        />
      )}
    </main>
  )
}
