import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hasAdmin } from '@/lib/auth'
import {
  parseSurveyConfigMap,
  validateDescriptionsInput,
  validatePanasItemsInput,
  validateQuickTagsInput,
  validateTipiQuestionsInput,
  validateTipiScoringInput,
} from '@/lib/survey-config'

export async function GET() {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const settings = await prisma.setting.findMany()
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]))
  const config = parseSurveyConfigMap(map)
  return NextResponse.json({
    maxRetries: Number(map.maxRetries ?? 3),
    fluxSteps: Number(map.fluxSteps ?? 28),
    ...config,
  })
}

export async function POST(req: NextRequest) {
  if (!await hasAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()

  const upserts: { key: string; value: string }[] = []

  if (body.maxRetries !== undefined) {
    const n = Number(body.maxRetries)
    if (!Number.isInteger(n) || n < 0 || n > 20) {
      return NextResponse.json({ error: '無效的重繪次數' }, { status: 400 })
    }
    upserts.push({ key: 'maxRetries', value: String(n) })
  }

  if (body.fluxSteps !== undefined) {
    const n = Number(body.fluxSteps)
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      return NextResponse.json({ error: '無效的推理步數' }, { status: 400 })
    }
    upserts.push({ key: 'fluxSteps', value: String(n) })
  }

  if (body.tipiQuestions !== undefined) {
    const value = validateTipiQuestionsInput(body.tipiQuestions)
    if (!value) {
      return NextResponse.json({ error: 'TIPI 題目需為 10 題' }, { status: 400 })
    }
    upserts.push({ key: 'tipiQuestions', value: JSON.stringify(value) })
  }

  if (body.tipiScoring !== undefined) {
    const value = validateTipiScoringInput(body.tipiScoring)
    if (!value) {
      return NextResponse.json({ error: 'TIPI 計分設定需為 10 項' }, { status: 400 })
    }
    upserts.push({ key: 'tipiScoring', value: JSON.stringify(value) })
  }

  if (body.panasItems !== undefined) {
    const value = validatePanasItemsInput(body.panasItems)
    if (!value) {
      return NextResponse.json({ error: 'PANAS 題目需為 12 題' }, { status: 400 })
    }
    upserts.push({ key: 'panasItems', value: JSON.stringify(value) })
  }

  if (body.descriptions !== undefined) {
    const value = validateDescriptionsInput(body.descriptions)
    if (!value) {
      return NextResponse.json({ error: '說明文字格式錯誤' }, { status: 400 })
    }
    upserts.push({ key: 'descriptions', value: JSON.stringify(value) })
  }

  if (body.quickTags !== undefined) {
    const value = validateQuickTagsInput(body.quickTags)
    if (!value) {
      return NextResponse.json({ error: '快速標籤格式錯誤' }, { status: 400 })
    }
    upserts.push({ key: 'quickTags', value: JSON.stringify(value) })
  }

  await Promise.all(upserts.map(({ key, value }) =>
    prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } })
  ))

  return NextResponse.json({ ok: true })
}
