import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAdmin } from '@/lib/auth'
import { analyzeImage } from '@/lib/vision'
import { parseSurveyConfigMap } from '@/lib/survey-config'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { promptId } = await params
  const id = Number(promptId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: '無效的 prompt ID' }, { status: 400 })
  }

  const [prompt, settings] = await Promise.all([
    prisma.prompt.findUnique({ where: { id } }),
    prisma.setting.findMany(),
  ])
  if (!prompt) return NextResponse.json({ error: '找不到此筆資料' }, { status: 404 })

  const { panasItems } = parseSurveyConfigMap(Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value])))
  const analysis = await analyzeImage(prompt.imageUrl, panasItems)

  await prisma.prompt.update({
    where: { id },
    data: { analysis: JSON.stringify(analysis) },
  })

  return NextResponse.json({ analysis })
}
