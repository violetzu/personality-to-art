import Link from 'next/link'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import {
  clearParticipantCookie,
  getResumeParticipantId,
} from '@/lib/auth'

interface ResumeState {
  title: string
  description: string
  href: string
  cta: string
}

async function getResumeState(): Promise<ResumeState | 'stale' | null> {
  const participantId = await getResumeParticipantId()
  if (!participantId) return null

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: {
      id: true,
      name: true,
    },
  })

  if (!participant) return 'stale'

  return {
    title: `找到 ${participant.name} 的上次紀錄`,
    description: '可以回到問卷頁面，載入上一次填寫的內容後繼續修改。',
    href: '/survey',
    cta: '回到上一次的填寫',
  }
}

export default async function HomePage() {
  const resumeState = await getResumeState()

  async function startNewSurveyAction() {
    'use server'
    await clearParticipantCookie()
    redirect('/survey')
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎨</div>
          <h1 className="text-2xl font-bold text-gray-800">AI 藝術創作與心理研究</h1>
          <p className="text-gray-500 mt-2 text-sm">本平台僅供研究參與者使用</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4">
          {resumeState && (
            <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-4 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {resumeState === 'stale' ? '偵測到舊紀錄' : resumeState.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {resumeState === 'stale'
                    ? '這台裝置曾有參與紀錄，但資料已不存在。你可以直接開始新問卷。'
                    : resumeState.description}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {resumeState !== 'stale' && (
                  <Link
                    href={resumeState.href}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors text-center"
                  >
                    {resumeState.cta}
                  </Link>
                )}
                <form action={startNewSurveyAction}>
                  <button
                    type="submit"
                    className="w-full border border-gray-200 hover:border-brand-400 text-gray-700 hover:text-brand-700 font-medium py-3 rounded-xl transition-colors"
                  >
                    開始新問卷
                  </button>
                </form>
              </div>
            </div>
          )}

          {!resumeState && (
            <Link
              href="/survey"
              className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors text-center"
            >
              開始新問卷
            </Link>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="/admin" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            管理員入口
          </a>
        </div>
      </div>
    </main>
  )
}
