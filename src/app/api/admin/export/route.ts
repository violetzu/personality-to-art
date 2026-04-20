import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAdmin } from '@/lib/auth'

export async function GET() {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const participants = await prisma.participant.findMany({
    include: { prompts: true },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'ID','姓名','年齡','性別',
    'TIPI_1','TIPI_2','TIPI_3','TIPI_4','TIPI_5',
    'TIPI_6','TIPI_7','TIPI_8','TIPI_9','TIPI_10',
    'PANAS_Active','PANAS_Nervous','PANAS_Happy','PANAS_Anxious','PANAS_Energetic','PANAS_Upset',
    'PANAS_Excited','PANAS_Afraid','PANAS_Interested','PANAS_Distressed','PANAS_Inspired','PANAS_Stressed',
    '自我意象藝術作品','自我描述',
    '外向性','親和性','盡責性','情緒穩定性','開放性',
    '實驗提示詞','圖片路徑','新增時間',
  ]

  const rows = participants.flatMap(p => {
    const base = [
      p.id, p.name, p.age, p.gender,
      p.tipi1, p.tipi2, p.tipi3, p.tipi4, p.tipi5,
      p.tipi6, p.tipi7, p.tipi8, p.tipi9, p.tipi10,
      p.panasActive, p.panasNervous, p.panasHappy, p.panasAnxious, p.panasEnergetic, p.panasUpset,
      p.panasExcited, p.panasAfraid, p.panasInterested, p.panasDistressed, p.panasInspired, p.panasStressed,
      p.selfArtPrompt ?? '', p.selfDescription ?? '',
      p.extraversion.toFixed(2), p.agreeableness.toFixed(2),
      p.conscientiousness.toFixed(2), p.stability.toFixed(2), p.openness.toFixed(2),
    ]
    if (p.prompts.length === 0) {
      return [[...base, '', '', p.createdAt.toISOString()]]
    }
    return p.prompts.map(pr => [
      ...base, pr.promptText, pr.imageUrl, p.createdAt.toISOString(),
    ])
  })

  const escape = (v: unknown) => {
    let s = String(v ?? '')
    if (/^[=+\-@]/.test(s)) {
      s = `'${s}`
    }
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s
  }

  const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="research_${Date.now()}.csv"`,
    },
  })
}
